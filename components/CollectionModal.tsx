"use client";

import { useEffect, useState } from "react";
import { useCreateCollection, useUpdateCollection, Collection } from "@/hooks/useCollections";

export default function CollectionModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Collection | null;
}) {
  const create = useCreateCollection();
  const update = useUpdateCollection();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [editing]);

  if (!open) return null;

  const onSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: name.trim(), description });
      } else {
        await create.mutateAsync({ name: name.trim(), description });
      }
      onClose();
    } catch (e: any) {
      // TODO: use toast message
      alert(e?.message === "limit-reached" ? "Free plan allows max 2 collections." : "Failed to save.");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="card p-5 w-full max-w-md vstack gap-4">
        <h3 className="text-lg font-semibold">{editing ? "Edit Collection" : "New Collection"}</h3>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="textarea h-24" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="hstack justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>
            {editing ? "Save" : "Create"}
          </button>
        </div>
        {(create.isPending || update.isPending) && <p className="text-sm text-muted">Saving…</p>}
      </div>
    </div>
  );
}
