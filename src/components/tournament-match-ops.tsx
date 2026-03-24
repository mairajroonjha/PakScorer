import { getAppSession } from "@/lib/auth";
import { getScorerAssignmentWorkspaceDb } from "@/lib/db-store";
import TournamentMatchOpsClient from "@/components/tournament-match-ops-client";

export default async function TournamentMatchOps() {
  const session = await getAppSession();
  const actorId = session?.user?.id;

  if (!actorId) {
    return null;
  }

  const workspace = await getScorerAssignmentWorkspaceDb(actorId);
  return <TournamentMatchOpsClient workspace={workspace} />;
}
