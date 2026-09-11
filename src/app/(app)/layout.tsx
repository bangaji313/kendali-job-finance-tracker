import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceData } from "@/lib/data/workspace";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspaceData();
  if (workspace.configured && !workspace.signedIn) redirect("/masuk");
  return <AppShell signedIn={workspace.signedIn}>{children}</AppShell>;
}
