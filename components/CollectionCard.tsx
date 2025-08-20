"use client";

import { CalendarClock, FileText, Pencil, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeleteCollection, Collection } from "@/hooks/useCollections";

export default function CollectionCard({ c, onEdit }: { c: Collection; onEdit: (c: Collection) => void }) {
  const router = useRouter();
  const del = useDeleteCollection();

  return (
    <div className="card p-4 vstack gap-3">
      <div className="hstack justify-between">
        <h3 className="text-lg font-semibold">{c.name}</h3>
        {!c.isShared && <div className="hstack gap-2">
          <button className="btn btn-ghost" onClick={() => onEdit(c)} title="Edit">
            <Pencil size={16} />
          </button>
          <button className="btn btn-ghost" onClick={() => del.mutate(c.id)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>}
      </div>
      <p className="text-sm text-muted flex-1">{c.description || "No description"}</p>
      <div className="hstack justify-between text-sm text-muted">
        <div className="hstack">
          <FileText size={16} />
          <span>{c.itemCount} items</span>
        </div>
        <div className="hstack">
          <CalendarClock size={16} />
          <span>{c.lastModified ? new Date(c.lastModified).toLocaleDateString() : "—"}</span>
        </div>
      </div>
      <div className="hstack justify-end">
        <button className="btn btn-primary" onClick={() => router.push(`/workspace/${c.id}`)}>
          Open <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
