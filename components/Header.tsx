"use client";
import { CircleUserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUI } from "@/store/ui";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";


export default function Header() {
  const { setUsernameModalOpen } = useUI();
  const router = useRouter();
  const pathname = usePathname();

  const { data } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) {
        setUsernameModalOpen(true);
        return null
      };
      return (await res.json()).user as { id: string; username: string; isPro: boolean };
    },
    staleTime: 60_000,
  });

  const username = data?.username ?? "Guest";

  return (
    <div className="w-full border-b border-[rgba(255,255,255,.06)]">
      <div className="container hstack justify-between py-3">
        <div className="hstack">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgb(var(--color-accent))" }} />
          <span className="font-semibold">NovaNote</span>
          {pathname !== "/" && (
            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost p-1 hover:underline"
              aria-label="Back to Collections"
            >
              ← Collections
            </button>
          )}
        </div>
        <div className="hstack text-muted">
          <CircleUserRound size={18} />
          <span>Welcome, {username}</span>
        </div>
      </div>
    </div>
  );
}