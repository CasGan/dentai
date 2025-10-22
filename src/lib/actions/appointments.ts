'use server';

import { auth } from "@clerk/nextjs/server";
// server action fetches appointments from db
import { prisma } from "../prisma";
import { AppointmentStatus } from "@prisma/client";

function transformAppointment(appointment: any){
    return {
        ...appointment,
        patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
        patientEmail: appointment.user.email,
        doctorName: appointment.doctor.name,
        doctorImageUrl: appointment.doctor.imageUrl || "",
        date: appointment.date.toISOString().split("T")[0],
    };
}

export async function getAppointments(){
    try {
        const appointments=await prisma.appointment.findMany({
            include: {
                user:{
                    select: {
                        firstName: true,
                        lastName: true, 
                        email: true
                    }
                }, 
                doctor: {
                    select: {
                        name: true, 
                        imageUrl: true
                    }
                },
            },
            orderBy: {createdAt: "desc"},
        }); 
        return appointments.map(transformAppointment); 
    } catch (error) {
        console.log("Error fetching appointments: " , error); 
        throw new Error("Failed to fetch appointments.");
    }
}

export async function getUserAppointments() {
    try {
        //gets auth user from clerk
        const { userId } = await auth(); 

        if(!userId) throw new Error("You must be logged in to view appointments");

        //find user by clerkId from auth session
        const user = await prisma.user.findUnique({where: {clerkId: userId}});

        if(!user) throw new Error("User not found. Please ensure account is properly set up.");

        //retries appointments of user
        const appointments = await prisma.appointment.findMany({
            where:{ userId: user.id},
            include: {
                user: { select: {firstName: true, lastName: true, email: true}},
                doctor: { select: {name: true, imageUrl: true}},
            },
            orderBy: [{date: "asc"}, {time: "asc"}],
        });

        return appointments.map(transformAppointment); 

    } catch (error) {
        console.error("Error fetching user appointments: ", error)
        throw new Error("Failed to fetch user appointments.");
    }
}

export async function getUserAppointmentStats(){
    try {
        const { userId } = await auth(); 

        if(!userId) throw new Error("You must be authenticated")
        
        const user = await prisma.user.findUnique({where: {clerkId: userId}})

        if(!user) throw new Error("User not found")
            // run in parallel 
        const [totalCount, completedCount] = await Promise.all([
            prisma.appointment.count({
                where: {userId: user.id},
            }),
            prisma.appointment.count({
                where: {
                    userId: user.id,
                    status: "COMPLETED",
                },
            }),
        ]);

        return {
            totalAppointments: totalCount,
            completedAppointments: completedCount
        }

    } catch (error) {
        console.error("Error fetching user appointment stats: ", error);
        return {totalAppointments: 0, completedAppointments: 0}
    }
}

export async function getBookedTimeSlots(doctorId: string, date: string){
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                date: new Date(date),
                status: {
                    in: ["CONFIRMED", "COMPLETED"],
                },
            },
            select: {time: true},
        });
        return appointments.map((appointment) => appointment.time);
    } catch (error) {
        console.error("Error fetching booked time slots: ", error);
        return [];
    }
}

interface BookAppointmentInput{
    doctorId: string; 
    date: string; 
    time: string; 
    reason?: string; 
} 

export async function bookAppointment(input: BookAppointmentInput){
    try {
        const {userId} = await auth(); 
        if(!userId) throw new Error("Please log in to book an appointment.");
        if(!input.doctorId || !input.date || !input.time){
            throw new Error("Please Select doctor, date, and time.");
        }
        const user = await prisma.user.findUnique({where: {clerkId: userId}});
        if(!user) throw new Error("User not found. Please ensure your account is properly set up. "); 

        //else create appointment 
        const appointment = await prisma.appointment.create({
            data: {
                userId: user.id,
                doctorId: input.doctorId,
                date: new Date(input.date),
                time: input.time,
                reason: input.reason || "General Consultation",
                status: "CONFIRMED",
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true, 
                        email: true,
                    },
                },
                doctor: {
                    select: {
                        name: true, 
                        imageUrl: true
                    }
                },
            },
        }); 

        return transformAppointment(appointment); 

    } catch (error) {
        console.error("Error booking appointment: ", error); 
        throw new Error("Failed to book appointment. Please try again later."); 
    }
}

export async function updateAppointmentStatus(input: {id: string; status: AppointmentStatus}){
    try {
        const appointment = await prisma.appointment.update({
            where: {id: input.id},
            data: {status: input.status}
        });
    } catch (error) {
        console.error("Error updating appointment: ", error); 
        throw new Error("Failed to update appointment");
    }
}