import { getAppSession } from "@/lib/auth";
import { getScorerWorkspaceDb } from "@/lib/db-store";
import ScorerConsoleClient from "@/components/scorer-console-client";

export default async function ScorerConsole() {
  const session = await getAppSession();
  const actorId = session?.user?.id;

  if (!actorId) {
    return null;
  }

  const assignments = await getScorerWorkspaceDb(actorId);
  return <ScorerConsoleClient assignments={assignments} />;
}
