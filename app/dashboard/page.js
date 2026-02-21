import { redirect } from "next/navigation";
import { getCurrentUser, seedDemoUser } from "../../lib/auth";
import { ItemsClient } from "./items-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Ensure demo user exists (and schema created)
  await seedDemoUser();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <ItemsClient user={user} />;
}
