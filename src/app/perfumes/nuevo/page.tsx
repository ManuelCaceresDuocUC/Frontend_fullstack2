import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Client from "./Client";

const norm = (s?: string) => s?.toLowerCase().trim() ?? "";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const admin = norm(process.env.ADMIN_EMAIL);
  const email = norm(session?.user?.email);

  if (!session) redirect("/api/auth/signin");
  if (!admin || email !== admin) redirect("/");

  return <Client />;
}
