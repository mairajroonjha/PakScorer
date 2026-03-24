"use client";

import type { Route } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

export interface PublicHomeFlashCard {
  id: string;
  tone: "live" | "upcoming" | "finished" | "ranking";
  eyebrow: string;
  title: string;
  value: string;
  meta: string;
  note: string;
  href: Route;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function FlashCard({
  card,
  featured
}: {
  card: PublicHomeFlashCard;
  featured?: boolean;
}) {
  const [pointerStyle, setPointerStyle] = useState({
    rotateX: 0,
    rotateY: 0,
    glowX: 50,
    glowY: 50
  });

  const style = useMemo(
    () =>
      ({
        "--flash-rotate-x": `${pointerStyle.rotateX}deg`,
        "--flash-rotate-y": `${pointerStyle.rotateY}deg`,
        "--flash-glow-x": `${pointerStyle.glowX}%`,
        "--flash-glow-y": `${pointerStyle.glowY}%`
      }) as CSSProperties,
    [pointerStyle]
  );

  function handleMove(event: React.MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const relativeY = (event.clientY - bounds.top) / bounds.height;

    setPointerStyle({
      rotateX: clamp((0.5 - relativeY) * 16, -8, 8),
      rotateY: clamp((relativeX - 0.5) * 18, -9, 9),
      glowX: clamp(relativeX * 100, 0, 100),
      glowY: clamp(relativeY * 100, 0, 100)
    });
  }

  function resetPointer() {
    setPointerStyle({
      rotateX: 0,
      rotateY: 0,
      glowX: 50,
      glowY: 50
    });
  }

  return (
    <Link
      href={card.href}
      className={[
        "public-flash-card",
        `public-flash-card--${card.tone}`,
        featured ? "public-flash-card--featured" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseMove={handleMove}
      onMouseLeave={resetPointer}
      onBlur={resetPointer}
      style={style}
    >
      <span className="public-flash-card__halo" aria-hidden="true" />
      <div className="public-flash-card__surface">
        <div className="public-flash-card__head">
          <p className="public-flash-card__eyebrow">{card.eyebrow}</p>
          <span className="public-flash-card__jump">Open</span>
        </div>
        <div className="public-flash-card__body">
          <h3>{card.title}</h3>
          <strong>{card.value}</strong>
          <p>{card.meta}</p>
        </div>
        <small>{card.note}</small>
      </div>
    </Link>
  );
}

export default function PublicHomeFlashDeck({
  cards
}: {
  cards: PublicHomeFlashCard[];
}) {
  return (
    <section className="public-flash-deck" aria-label="Home flash cards">
      {cards.map((card, index) => (
        <FlashCard key={card.id} card={card} featured={index === 0} />
      ))}
    </section>
  );
}
