import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";


async function AdminPage() {
    const user = await currentUser(); 

    // user not logged in 
    if(!user) redirect("/");

    const adminEmail = process.env.ADMIN_EMAIL; 
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // user not admin
    if(!adminEmail || userEmail !== adminEmail) redirect("/dashboard");

    return <AdminDashboardClient />;
}
export default AdminPage; 
