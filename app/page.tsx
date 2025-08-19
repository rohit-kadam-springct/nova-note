"use client";

import { useState } from "react";
import { useCollections, Collection } from "@/hooks/useCollections";
import CollectionCard from "@/components/CollectionCard";
import CollectionModal from "@/components/CollectionModal";

export default function Home() {
  const { data, isLoading, isError } = useCollections();

  // TODO: merge below states
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);

  return (
    <main className="container py-8 vstack gap-6">
      <header className="vstack gap-2">
        <h1 className="text-3xl font-bold">Your Collections</h1>
        <p className="text-muted">Create and manage your Knowledge Vaults.</p>
      </header>

      <div className="hstack justify-between">
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          New Collection
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-32 animate-pulse" />)}
        </div>
      )}

      {isError && (
        <div className="card p-4">
          <p className="text-red-400">Failed to load collections.</p>
        </div>
      )}

      {!isLoading && data && (
        <>
          {data.length === 0 ? (
            <div className="card p-6 vstack items-center text-center gap-2">
              <p className="text-lg font-semibold">No collections yet</p>
              <p className="text-muted text-sm">Click “New Collection” to create your first vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.map((c) => (
                <CollectionCard key={c.id} c={c} onEdit={(col) => { setEditing(col); setModalOpen(true); }} />
              ))}
            </div>
          )}
        </>
      )}

      <CollectionModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
    </main>
  );
}
