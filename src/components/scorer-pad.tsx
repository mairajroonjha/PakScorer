"use client";

import { useState } from "react";

const runButtons = [0, 1, 2, 3, 4, 6];

async function postBall(runs: number, wicket = false) {
  const response = await fetch("/api/matches/m-1/balls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      over: 0,
      ball: 1,
      strikerId: "batter-1",
      bowlerId: "bowler-1",
      runs,
      isWicket: wicket
    })
  });
  return response.json();
}

export default function ScorerPad() {
  const [lastEvent, setLastEvent] = useState<string>("No updates yet");

  async function submitBall(runs: number, wicket = false) {
    const result = await postBall(runs, wicket);
    if (!result?.ok) {
      setLastEvent(result?.error ?? "Unable to record the ball. Check your scorer login.");
      return;
    }

    setLastEvent(
      wicket
        ? `Wicket recorded: ${result?.data?.event?.id ?? "unknown"}`
        : `Added ${runs} run(s): ${result?.data?.event?.id ?? "unknown"}`
    );
  }

  return (
    <div className="card">
      <h3>Scorer Control Pad</h3>
      <p className="muted">Button-only fast scoring interface for ground operator.</p>
      <div className="actions">
        {runButtons.map((run) => (
          <button
            key={run}
            onClick={() => void submitBall(run, false)}
          >
            +{run}
          </button>
        ))}
        <button className="alert" onClick={() => void submitBall(0, true)}>
          Wicket
        </button>
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        {lastEvent}
      </p>
    </div>
  );
}
