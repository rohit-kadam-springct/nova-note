"use client";
import { useMutation } from "@tanstack/react-query";

export function useChat(collectionId: string) {
  return useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, question }),
      });
      if (!res.ok) throw new Error("chat-failed");
      return res.json();
    }
  });
}