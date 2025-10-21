import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import resend from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST(request: Request){
    try {
        const body = await request.json(); 

        const{
            userEmail, 
            doctorName,
            appointmentDate,
            appointmentTime,
            appointmentType,
            duration,
            price ,
        } = body;

        if(!userEmail || !doctorName || !appointmentDate || !appointmentTime){
            return NextResponse.json({error: "Missing required fields"}, {status: 400});
        }
        const {data, error} = await resend.emails.send({
            from: "Dentai <no-reply@resend.dev>", // do not use in production !! Only for Testing !!
            to: [userEmail],
            subject: "Appointment Confirmatioon - Dentai",
            react: AppointmentConfirmationEmail({
                doctorName,
                appointmentDate,
                appointmentTime,
                appointmentType,
                duration,
                price,
            })
        });

        if(error){
            console.error("Resend error: ", error); 
            return NextResponse.json({error: "Failed to send email"}, {status: 500});
        }

        return NextResponse.json(
            {message: "Email sent successfully", emailId: data?.id},
            {status: 200}
        );

    } catch (error) {
        console.error("Error sending email: ", error)
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }
}