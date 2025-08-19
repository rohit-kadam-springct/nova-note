"use client";
import { useState } from "react";
import { CircleUserRound } from "lucide-react";

export default function Header() {
  const [username] = useState<string | null>(null); // will wire later
  return (
    <div className="w-full border-b border-[rgba(255,255,255,.06)]">
      <div className="container hstack justify-between py-3">
        <div className="hstack">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgb(var(--color-accent))" }} />
          <span className="font-semibold">NovaNote</span>
        </div>
        <div className="hstack text-muted">
          <CircleUserRound size={18} />
          <span>{username ?? "Guest"}</span>
        </div>
      </div>
    </div>
  );
}