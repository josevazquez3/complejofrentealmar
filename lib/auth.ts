import { auth } from "@/auth";

export type AppUser = {
  id: string;
  email: string;
  rol: string;
};

/**
 * Usuario de sesión NextAuth en el servidor (o null).
 */
export async function getServerUser(): Promise<AppUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      rol: session.user.rol ?? "ADMIN",
    };
  } catch {
    return null;
  }
}
