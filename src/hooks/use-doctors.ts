'use client';
import { createDoctor, getDoctors, updateDoctor } from "@/lib/actions/doctors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

 

//hook to call doctors.ts server action
export function useGetDoctors(){
    const result = useQuery({
        queryKey: ["getDoctors"],
        queryFn: getDoctors, 
    }); 

    return result; 
}

export function useCreateDoctor(){
    const queryClient = useQueryClient()

    const result = useMutation({
        mutationFn: createDoctor,
        onSuccess: () => {
            // invalidate related queries to refresh data 
            queryClient.invalidateQueries({queryKey: ["getDoctors"]});
        },
        onError: (error) => console.log("Error creating doctor"),
    });
    return result; 
}

export function useUpdateDoctor(){
    const queryClient = useQueryClient(); 

    return useMutation({
        mutationFn: updateDoctor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getDoctors"]});
        },
        onError: (error) => console.error("Failed to update doctor information:", error)
    });
}