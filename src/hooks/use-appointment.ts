"use client";
//  hook to use query 
import { getAppointments } from "@/lib/actions/appointments";
import { useQuery } from "@tanstack/react-query";

//hook to call doctors.ts server action
export function useGetAppointments() {
  const result = useQuery({
    queryKey: ["getAppointments"],
    queryFn: getAppointments,
  });

  return result;
}
