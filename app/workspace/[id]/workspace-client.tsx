"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileText, Link2, FileDown, Trash2, SquarePlus, MessagesSquare, Globe } from "lucide-react";

type Item = {
  id: string;
  title: string;
  type: "text" | "link" | "pdf";
  url?: string | null;
  createdAt: string;
};

type Limits = {
  text: { used: number; max: number };
  link: { used: number; max: number };
  pdf: { used: number; max: number };
  isPro: boolean;
};

async function fetchItems(collectionId: string): Promise<Item[]> {
  const res = await fetch(`/api/items?collectionId=${collectionId}`);
  if (!res.ok) throw new Error("load-items-failed");
  const data = await res.json();
  return data.items as Item[];
}

async function fetchLimits(collectionId: string): Promise<Limits> {
  const res = await fetch(`/api/limits?collectionId=${collectionId}`);
  if (!res.ok) throw new Error("load-limits-failed");
  return res.json();
}

export default function WorkspaceClient({ id }: { id: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "iframe">("chat");
  const [selectedLink, setSelectedLink] = useState<string | null>(null); // url
  const [deleting, setDeleting] = useState<string | null>(null); // item id

  const {  data: items, isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ["items", id],
    queryFn: () => fetchItems(id),
  });

  const {  data: limits, isLoading: limitsLoading, refetch: refetchLimits } = useQuery({
    queryKey: ["limits", id],
    queryFn: () => fetchLimits(id),
  });

  const grouped = useMemo(() => {
    const g: Record<"text" | "link" | "pdf", Item[]> = { text: [], link: [], pdf: [] };
    (items ?? []).forEach((it) => g[it.type].push(it));
    return g;
  }, [items]);

  // Delete item handler
  const onDelete = async (itemId: string) => {
    try {
      setDeleting(itemId);
      const res = await fetch(`/api/items?id=${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete-failed");
      await Promise.all([refetchItems(), refetchLimits()]);
    } catch (e) {
      alert("Failed to delete item.");
    } finally {
      setDeleting(null);
    }
  };

  // Add handlers just flip small client modals; real wiring in next hour
  const [showAddText, setShowAddText] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddPDF, setShowAddPDF] = useState(false);

  // Quick limit helpers
  const textFull = limits && !limits.isPro && limits.text.used >= limits.text.max;
  const linkFull = limits && !limits.isPro && limits.link.used >= limits.link.max;
  const pdfFull = limits && !limits.isPro && limits.pdf.used >= limits.pdf.max;

  return (
    <main className="container py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      {/* Sidebar */}
      <aside className="card p-4 vstack gap-4">
        <div className="vstack gap-2">
          <h2 className="text-lg font-semibold">Knowledge</h2>
          <p className="text-sm text-muted">Manage items in this collection</p>
        </div>

        {/* Usage */}
        <div className="vstack gap-2">
          <UsageRow label="Texts" used={limits?.text.used ?? 0} max={limits?.text.max ?? 2} loading={limitsLoading} />
          <UsageRow label="Links" used={limits?.link.used ?? 0} max={limits?.link.max ?? 2} loading={limitsLoading} />
          <UsageRow label="PDFs" used={limits?.pdf.used ?? 0} max={limits?.pdf.max ?? 1} loading={limitsLoading} />
        </div>

        {/* Add buttons */}
        <div className="vstack">
          <button className="btn btn-ghost" disabled={!!textFull} onClick={() => setShowAddText(true)}>
            <SquarePlus size={16} /> Add Text {textFull ? "(limit)" : ""}
          </button>
          <button className="btn btn-ghost" disabled={!!linkFull} onClick={() => setShowAddLink(true)}>
            <SquarePlus size={16} /> Add Link {linkFull ? "(limit)" : ""}
          </button>
          <button className="btn btn-ghost" disabled={!!pdfFull} onClick={() => setShowAddPDF(true)}>
            <SquarePlus size={16} /> Add PDF {pdfFull ? "(limit)" : ""}
          </button>
        </div>

        {/* Items */}
        <Section title="Texts" icon={<FileText size={16} />}>
          {itemsLoading ? (
            <SkeletonLine />
          ) : grouped.text.length === 0 ? (
            <EmptyLine text="No texts" />
          ) : (
            grouped.text.map((it) => (
              <ItemRow key={it.id} it={it} onDelete={() => onDelete(it.id)} deleting={deleting === it.id} onOpen={() => setTab("chat")} />
            ))
          )}
        </Section>

        <Section title="Links" icon={<Link2 size={16} />}>
          {itemsLoading ? (
            <SkeletonLine />
          ) : grouped.link.length === 0 ? (
            <EmptyLine text="No links" />
          ) : (
            grouped.link.map((it) => (
              <ItemRow
                key={it.id}
                it={it}
                onDelete={() => onDelete(it.id)}
                deleting={deleting === it.id}
                onOpen={() => {
                  if (it.url) setSelectedLink(it.url);
                  setTab("iframe");
                }}
              />
            ))
          )}
        </Section>

        <Section title="PDFs" icon={<FileDown size={16} />}>
          {itemsLoading ? (
            <SkeletonLine />
          ) : grouped.pdf.length === 0 ? (
            <EmptyLine text="No PDFs" />
          ) : (
            grouped.pdf.map((it) => (
              <ItemRow key={it.id} it={it} onDelete={() => onDelete(it.id)} deleting={deleting === it.id} onOpen={() => setTab("chat")} />
            ))
          )}
        </Section>
      </aside>

      {/* Main Panel */}
      <section className="vstack gap-4">
        <button className="btn btn-ghost" onClick={() => history.back()}>← Back</button>
        {/* Tabs */}
        <div className="hstack gap-2">
          <button className={`btn btn-ghost ${tab === "chat" ? "border border-[rgba(255,255,255,.12)]" : ""}`} onClick={() => setTab("chat")}>
            <MessagesSquare size={16} /> Chat
          </button>
          <button className={`btn btn-ghost ${tab === "iframe" ? "border border-[rgba(255,255,255,.12)]" : ""}`} onClick={() => setTab("iframe")}>
            <Globe size={16} /> Iframe
          </button>
        </div>

        {/* Panels */}
        {tab === "chat" ? (
          <div className="card p-4 min-h-[60vh]">
            <p className="text-muted">Chat panel will appear here. Ask questions using your collection’s knowledge.</p>
            {/* We’ll wire the real chat in Hour 6–7/7–8 */}
          </div>
        ) : (
          <div className="card p-0 min-h-[60vh] overflow-hidden">
            {selectedLink ? (
              <iframe src={selectedLink} className="w-full h-[70vh]" />
            ) : (
              <div className="p-6">
                <p className="text-muted">Select a link item to open it here.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Modals (stubs for next hour) */}
      {showAddText && (
        <AddTextModal
          onClose={async () => {
            setShowAddText(false);
            await Promise.all([refetchItems(), refetchLimits()]);
          }}
          collectionId={id}
        />
      )}
      {showAddLink && (
        <AddLinkModal
          onClose={async () => {
            setShowAddLink(false);
            await Promise.all([refetchItems(), refetchLimits()]);
          }}
          collectionId={id}
        />
      )}
      {showAddPDF && (
        <AddPDFModal
          onClose={async () => {
            setShowAddPDF(false);
            await Promise.all([refetchItems(), refetchLimits()]);
          }}
          collectionId={id}
        />
      )}
    </main>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="vstack gap-2">
      <div className="hstack gap-2 text-sm text-muted">
        {icon}
        <span className="uppercase tracking-wide">{title}</span>
      </div>
      <div className="vstack gap-2">{children}</div>
    </div>
  );
}

function ItemRow({ it, onDelete, onOpen, deleting }: { it: Item; onDelete: () => void; onOpen: () => void; deleting: boolean }) {
  return (
    <div className="hstack justify-between">
      <button className="text-left hover:underline truncate" onClick={onOpen} title={it.title}>
        {it.title}
      </button>
      <button className="btn btn-ghost" onClick={onDelete} disabled={deleting} title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function UsageRow({ label, used, max, loading }: { label: string; used: number; max: number; loading: boolean }) {
  return (
    <div className="vstack gap-1">
      <div className="hstack justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-muted">{loading ? "…" : `${used}/${max}`}</span>
      </div>
      <div className="w-full h-1.5 bg-[rgba(255,255,255,.08)] rounded">
        <div
          className="h-1.5 rounded"
          style={{ width: `${Math.min(100, (used / Math.max(1, max)) * 100)}%`, background: "rgb(var(--color-primary))" }}
        />
      </div>
    </div>
  );
}

function SkeletonLine() {
  return <div className="h-6 bg-[rgba(255,255,255,.06)] rounded animate-pulse" />;
}
function EmptyLine({ text }: { text: string }) {
  return <div className="text-sm text-muted">{text}</div>;
}

// Modal stubs; we wire actions next hour
function AddTextModal({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      // 1) create item
      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, type: "text", title: title.trim() }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        alert(e?.error === "limit-reached" ? "Free plan: max 2 texts per collection." : "Failed to create item.");
        return;
      }
      const { item } = await createRes.json();

      // 2) embed content to Qdrant
      const embedRes = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          itemId: item.id,
          itemType: "text",
          title: title.trim(),
          sourceUrl: null,
          text: content,
        }),
      });
      if (!embedRes.ok) {
        alert("Indexing failed, please try again.");
        return;
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="card p-5 w-full max-w-lg vstack gap-3">
        <h3 className="text-lg font-semibold">Add Text</h3>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="textarea h-48" placeholder="Paste your text…" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="hstack justify-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading || !title || !content}>
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}


function AddLinkModal({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      // 1) Crawl/extract
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, url: url.trim() }),
      });
      if (!crawlRes.ok) {
        const e = await crawlRes.json().catch(() => ({}));
        alert(e?.error === "empty-content" ? "No readable content found." : "Failed to fetch page.");
        return;
      }
      const { title, content } = await crawlRes.json();

      // 2) Create link item (store title and url)
      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, type: "link", title, url: url.trim() }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        alert(e?.error === "limit-reached" ? "Free plan: max 2 links per collection." : "Failed to create item.");
        return;
      }
      const { item } = await createRes.json();

      // 3) Embed extracted content
      const embedRes = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          itemId: item.id,
          itemType: "link",
          title,
          sourceUrl: url.trim(),
          text: content,
        }),
      });
      if (!embedRes.ok) {
        alert("Indexing failed, please try again.");
        return;
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="card p-5 w-full max-w-lg vstack gap-3">
        <h3 className="text-lg font-semibold">Add Link</h3>
        <input className="input" placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div className="hstack justify-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading || !url}>
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}


import { extractPdfTextFromArrayBuffer } from "@/lib/pdf";

function AddPDFModal({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const ab = await file.arrayBuffer();
      const text = await extractPdfTextFromArrayBuffer(ab);
      const title = file.name.replace(/\.[^.]+$/, "");

      // 1) Create pdf item
      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, type: "pdf", title }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        alert(e?.error === "limit-reached" ? "Free plan: max 1 PDF per collection." : "Failed to create item.");
        return;
      }
      const { item } = await createRes.json();

      // 2) Embed pdf text
      const embedRes = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          itemId: item.id,
          itemType: "pdf",
          title,
          sourceUrl: null,
          text,
        }),
      });
      if (!embedRes.ok) {
        alert("Indexing failed, please try again.");
        return;
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="card p-5 w-full max-w-lg vstack gap-3">
        <h3 className="text-lg font-semibold">Add PDF</h3>
        <input className="input" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="hstack justify-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading || !file}>
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

