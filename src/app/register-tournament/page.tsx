import SuperTournamentStudio from "@/components/super-tournament-studio";

export const dynamic = "force-dynamic";

export default function RegisterTournamentPage() {
  return (
    <main className="page-stack">
      <section className="hero hero--tournament">
        <div className="hero__copy">
          <p className="hero__eyebrow">Tournament Registration</p>
          <h1>Register your tournament for Super Admin approval.</h1>
          <p className="hero__body">
            Fill the full tournament details, set the tournament admin account, and submit the request. The platform will not activate the competition until Super Admin approves it.
          </p>
        </div>
        <div className="hero__chips">
          <span className="chip">Full registration form</span>
          <span className="chip">Admin account setup</span>
          <span className="chip">Approval required</span>
        </div>
      </section>
      <section className="dashboard-panel super-panel">
        <SuperTournamentStudio mode="request" />
      </section>
    </main>
  );
}
