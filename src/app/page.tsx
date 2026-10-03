import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth/session";

export default async function RootPage() {
  const member = await getSessionMember();
  redirect(member ? "/team" : "/login");
}
