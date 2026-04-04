import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Punto de entrada `/admin`: envía al login o al dashboard. */
export default async function AdminIndexPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin/login");
  }
  redirect("/admin/dashboard");
}
