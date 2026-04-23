import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.role === "SENIOR") redirect("/home");
  if (session?.role === "CAREGIVER") redirect("/dashboard");

  return <LoginClient />;
}
