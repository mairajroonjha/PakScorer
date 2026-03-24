import { getAppSession } from "@/lib/auth";
import { getTeamAdminWorkspaceDb } from "@/lib/db-store";
import TeamOwnerWorkspaceClient from "@/components/team-owner-workspace-client";

export default async function TeamOwnerWorkspace() {
  const session = await getAppSession();
  const actorId = session?.user?.id;
  const workspaces = actorId ? await getTeamAdminWorkspaceDb(actorId) : [];

  return <TeamOwnerWorkspaceClient workspaces={workspaces} />;
}
