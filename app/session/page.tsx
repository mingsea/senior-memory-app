import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SessionRunner from "./SessionRunner";

export default async function SessionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SENIOR") redirect("/dashboard");

  return <SessionRunner seniorName={session.displayName} />;
}
