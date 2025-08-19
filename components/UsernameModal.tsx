"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useUI } from "@/store/ui";

async function getUser() {
  const res = await fetch("/api/user", { method: "GET" });
  if (res.ok) return res.json();
  throw new Error("no-user");
}

async function createUser(username: string) {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("create-failed");
  return res.json();
}

export default function UsernameModal() {
  const { usernameModalOpen, setUsernameModalOpen } = useUI();
  const [username, setUsername] = useState("");

  // Try to fetch existing user on mount; if 404, open modal
  useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        console.log("Calling")
        const data = await getUser();
        console.log("Data", data)
        setUsernameModalOpen(false);
        return data.user;
      } catch {
        console.log("setting username error")
        setUsernameModalOpen(true);
        return null;
      }
    },
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setUsernameModalOpen(false);
      // force a refresh to pick up server cookies in server components if needed
      window.location.reload();
    },
  });

  if (!usernameModalOpen) return null;

  console.log("Model is displayed")

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="card p-5 w-full max-w-md vstack gap-4">
        <div className="vstack gap-1">
          <h2 className="text-xl font-semibold">Welcome to NovaNote</h2>
          <p className="text-muted text-sm">Enter a username to get started. No login required.</p>
        </div>

        <input
          className="input"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={40}
        />

        <div className="hstack justify-end">
          <button
            className="btn btn-primary"
            onClick={() => mutation.mutate(username)}
            disabled={!username || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}