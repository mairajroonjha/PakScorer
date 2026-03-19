import { getTop10Db } from "@/lib/db-store";

export interface MonthlyAwardCertificate {
  month: string;
  year: number;
  winnerId: string;
  winnerLabel: string;
  metric: string;
  value: number;
  certificateUrl: string;
}

export async function generateMonthlyAwardsCertificate(now = new Date()): Promise<MonthlyAwardCertificate | null> {
  const snapshot = await getTop10Db("global");
  const winner = snapshot.entries[0];
  if (!winner) {
    return null;
  }
  const month = now.toLocaleString("en-US", { month: "long" });
  const year = now.getUTCFullYear();
  return {
    month,
    year,
    winnerId: winner.subjectId,
    winnerLabel: winner.label,
    metric: winner.metric,
    value: winner.value,
    certificateUrl: `https://cdn.cricbela.local/certificates/${year}-${month.toLowerCase()}-${winner.subjectId}.pdf`
  };
}
