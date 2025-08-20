"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Link2,
  FileDown,
  Trash2,
  SquarePlus,
  MessagesSquare,
  Globe,
} from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { toast } from "react-hot-toast";
import { extractPdfTextFromArrayBuffer } from "@/lib/pdf";
import { Collection } from "@/hooks/useCollections";

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
  const [tab, setTab] = useState<"chat" | "iframe">("chat");
  const [selectedLink, setSelectedLink] = useState<string | null>(null); // url
  const [deleting, setDeleting] = useState<string | null>(null); // item id

  const { data: collection } = useQuery<Collection>({
    queryKey: ["collection", id],
    queryFn: async () => {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      return res.json();
    },
  });

  const {
    data: items,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["items", id],
    queryFn: () => fetchItems(id),
  });

  const {
    data: limits,
    isLoading: limitsLoading,
    refetch: refetchLimits,
  } = useQuery({
    queryKey: ["limits", id],
    queryFn: () => fetchLimits(id),
  });

  const grouped = useMemo(() => {
    const g: Record<"text" | "link" | "pdf", Item[]> = {
      text: [],
      link: [],
      pdf: [],
    };
    (items ?? []).forEach((it) => g[it.type].push(it));
    return g;
  }, [items]);

  // Delete item handler
  const onDelete = async (itemId: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      setDeleting(itemId);
      const res = await fetch(`/api/items?id=${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete item.");
        return;
      }
      toast.success("Item deleted");
      await Promise.all([refetchItems(), refetchLimits()]);
    } catch {
      toast.error("Failed to delete item.");
    } finally {
      setDeleting(null);
    }
  };

  // Add modal control states
  const [showAddText, setShowAddText] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddPDF, setShowAddPDF] = useState(false);

  // Quick limit flags
  const textFull =
    limits && !limits.isPro && limits.text.used >= limits.text.max;
  const linkFull =
    limits && !limits.isPro && limits.link.used >= limits.link.max;
  const pdfFull = limits && !limits.isPro && limits.pdf.used >= limits.pdf.max;

  return (
    <main className="container py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      {/* Sidebar */}
      <aside className="card p-4 vstack gap-4 max-h-[80vh] overflow-y-auto">
        <div className="vstack gap-2">
          <h2 className="text-lg font-semibold">
            {collection?.name ?? "Knowledge"}
          </h2>
          <p className="text-sm text-muted">Manage items in this collection</p>
        </div>

        {/* Usage */}
        <div className="vstack gap-2">
          <UsageRow
            label="Texts"
            used={limits?.text.used ?? 0}
            max={limits?.text.max ?? 2}
            loading={limitsLoading}
          />
          <UsageRow
            label="Links"
            used={limits?.link.used ?? 0}
            max={limits?.link.max ?? 2}
            loading={limitsLoading}
          />
          <UsageRow
            label="PDFs"
            used={limits?.pdf.used ?? 0}
            max={limits?.pdf.max ?? 1}
            loading={limitsLoading}
          />
        </div>

        {/* Add buttons with disabled and tooltip */}
        <div className="vstack">
          <button
            className={`btn btn-ghost ${
              textFull ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!!textFull}
            title={textFull ? "Upgrade to Pro for more texts" : "Add Text"}
            onClick={() => setShowAddText(true)}
            aria-label="Add Text"
          >
            <SquarePlus size={16} /> Add Text {textFull ? "(limit)" : ""}
          </button>
          <button
            className={`btn btn-ghost ${
              linkFull ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!!linkFull}
            title={linkFull ? "Upgrade to Pro for more links" : "Add Link"}
            onClick={() => setShowAddLink(true)}
            aria-label="Add Link"
          >
            <SquarePlus size={16} /> Add Link {linkFull ? "(limit)" : ""}
          </button>
          <button
            className={`btn btn-ghost ${
              pdfFull ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!!pdfFull}
            title={pdfFull ? "Upgrade to Pro for more PDFs" : "Add PDF"}
            onClick={() => setShowAddPDF(true)}
            aria-label="Add PDF"
          >
            <SquarePlus size={16} /> Add PDF {pdfFull ? "(limit)" : ""}
          </button>
        </div>

        {/* Items list sections */}
        <Section title="Texts" icon={<FileText size={16} />}>
          {itemsLoading ? (
            <SkeletonLine />
          ) : grouped.text.length === 0 ? (
            <EmptyLine text="No texts" />
          ) : (
            grouped.text.map((it) => (
              <ItemRow
                key={it.id}
                it={it}
                onDelete={() => onDelete(it.id)}
                deleting={deleting === it.id}
                onOpen={() => setTab("chat")}
                isShared={collection?.isShared}
              />
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
                isShared={collection?.isShared}
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
              <ItemRow
                key={it.id}
                it={it}
                onDelete={() => onDelete(it.id)}
                deleting={deleting === it.id}
                onOpen={() => setTab("chat")}
                isShared={collection?.isShared}
              />
            ))
          )}
        </Section>
      </aside>

      {/* Main Panel */}
      <section className="vstack gap-4">
        {/* Tabs */}
        <div
          className="hstack gap-2"
          role="tablist"
          aria-label="Workspace tabs"
        >
          <button
            role="tab"
            aria-selected={tab === "chat"}
            className={`btn btn-ghost ${
              tab === "chat" ? "border border-[rgba(255,255,255,.12)]" : ""
            }`}
            onClick={() => setTab("chat")}
          >
            <MessagesSquare size={16} /> Chat
          </button>
          <button
            role="tab"
            aria-selected={tab === "iframe"}
            className={`btn btn-ghost ${
              tab === "iframe" ? "border border-[rgba(255,255,255,.12)]" : ""
            }`}
            onClick={() => setTab("iframe")}
          >
            <Globe size={16} /> Iframe
          </button>
        </div>

        {/* Panels */}
        {tab === "chat" ? (
          <div className="card p-4 min-h-[60vh] overflow-auto">
            <ChatPanel
              collectionId={id}
              items={items ?? []}
              onReferenceClick={(ref) => {
                const matched = items?.find((it) => it.id === ref.itemId);
                if (!matched) return;
                if (matched.type === "link" && matched.url) {
                  setSelectedLink(matched.url);
                  setTab("iframe");
                } else {
                  toast(`Source: ${matched.title} (${matched.type})`);
                }
              }}
            />
          </div>
        ) : (
          <div className="card p-0 min-h-[60vh] overflow-hidden">
            {selectedLink ? (
              <iframe
                src={selectedLink}
                className="w-full h-[70vh]"
                title="Linked Content"
              />
            ) : (
              <div className="p-6 text-muted">
                Select a link item to open it here.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Modals */}
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

/* -- Helper UI Components -- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="vstack gap-2" aria-label={title}>
      <div className="hstack gap-2 text-sm text-muted">
        {icon}
        <span className="uppercase tracking-wide">{title}</span>
      </div>
      <div className="vstack gap-2">{children}</div>
    </section>
  );
}

function ItemRow({
  it,
  onDelete,
  onOpen,
  deleting,
  isShared = false,
}: {
  it: Item;
  onDelete: () => void;
  onOpen: () => void;
  deleting: boolean;
  isShared?: boolean;
}) {
  return (
    <div className="hstack justify-between" role="listitem">
      <button
        className="text-left hover:underline truncate"
        onClick={onOpen}
        title={it.title}
        aria-label={`Open ${it.type} item: ${it.title}`}
      >
        {it.title}
      </button>
      {!isShared && (
        <button
          className="btn btn-ghost"
          onClick={onDelete}
          disabled={deleting}
          title="Delete"
          aria-label={`Delete ${it.type} item: ${it.title}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function UsageRow({
  label,
  used,
  max,
  loading,
}: {
  label: string;
  used: number;
  max: number;
  loading: boolean;
}) {
  return (
    <div
      className="vstack gap-1"
      aria-label={`${label} usage: ${used} of ${max}`}
    >
      <div className="hstack justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-muted">{loading ? "…" : `${used}/${max}`}</span>
      </div>
      <div
        className="w-full h-1.5 bg-[rgba(255,255,255,.08)] rounded"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={used}
      >
        <div
          className="h-1.5 rounded"
          style={{
            width: `${Math.min(100, (used / Math.max(1, max)) * 100)}%`,
            background: "rgb(var(--color-primary))",
          }}
        />
      </div>
    </div>
  );
}

function SkeletonLine() {
  return (
    <div
      className="h-6 bg-[rgba(255,255,255,.06)] rounded animate-pulse"
      aria-hidden="true"
    />
  );
}
function EmptyLine({ text }: { text: string }) {
  return (
    <div className="text-sm text-muted italic" aria-live="polite" role="region">
      {text}
    </div>
  );
}

/* -- AddTextModal Component -- */
function AddTextModal({
  collectionId,
  onClose,
}: {
  collectionId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setLoading(true);
    try {
      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          type: "text",
          title: title.trim(),
        }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        toast.error(
          e?.error === "limit-reached"
            ? "Free plan: max 2 texts per collection."
            : "Failed to create item."
        );
        return;
      }
      const { item } = await createRes.json();

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
        toast.error("Indexing failed, please try again.");
        return;
      }
      toast.success("Text added!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Add Text" loading={loading}>
      <input
        className="input mb-3"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />
      <textarea
        className="textarea h-48"
        placeholder="Paste your text here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <ModalButtons
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmDisabled={loading || !title || !content}
      />
    </Modal>
  );
}

/* -- AddLinkModal Component -- */
function AddLinkModal({
  collectionId,
  onClose,
}: {
  collectionId: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!url.trim()) {
      toast.error("URL is required.");
      return;
    }
    setLoading(true);
    try {
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, url: url.trim() }),
      });
      if (!crawlRes.ok) {
        const e = await crawlRes.json().catch(() => ({}));
        toast.error(
          e?.error === "empty-content"
            ? "No readable content found."
            : "Failed to fetch page."
        );
        return;
      }
      const { title, content } = await crawlRes.json();

      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          type: "link",
          title,
          url: url.trim(),
        }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        toast.error(
          e?.error === "limit-reached"
            ? "Free plan: max 2 links per collection."
            : "Failed to create item."
        );
        return;
      }
      const { item } = await createRes.json();

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
        toast.error("Indexing failed, please try again.");
        return;
      }
      toast.success("Link added!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Add Link" loading={loading}>
      <input
        className="input"
        placeholder="https://example.com/article"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <ModalButtons
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmDisabled={loading || !url}
      />
    </Modal>
  );
}

/* -- AddPDFModal Component -- */
function AddPDFModal({
  collectionId,
  onClose,
}: {
  collectionId: string;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!file) {
      toast.error("PDF file required.");
      return;
    }
    setLoading(true);
    try {
      const ab = await file.arrayBuffer();
      const text = await extractPdfTextFromArrayBuffer(ab);
      const title = file.name.replace(/\.[^.]+$/, "");

      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, type: "pdf", title }),
      });
      if (!createRes.ok) {
        const e = await createRes.json().catch(() => ({}));
        toast.error(
          e?.error === "limit-reached"
            ? "Free plan: max 1 PDF per collection."
            : "Failed to create item."
        );
        return;
      }
      const { item } = await createRes.json();

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
        toast.error("Indexing failed, please try again.");
        return;
      }
      toast.success("PDF added!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Add PDF" loading={loading}>
      <input
        className="input"
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <ModalButtons
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmDisabled={loading || !file}
      />
    </Modal>
  );
}

/* -- Modal generic wrapper and buttons -- */
function Modal({
  children,
  onClose,
  title,
  loading,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  loading?: boolean;
}) {
  useEffect(() => {
    function escHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 grid place-items-center bg-black/50 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="card p-5 w-full max-w-lg vstack gap-4">
        <h3 id="modal-title" className="text-lg font-semibold">
          {title}
        </h3>
        {children}
        {loading && <p className="text-muted">Processing…</p>}
      </div>
    </div>
  );
}

function ModalButtons({
  onCancel,
  onConfirm,
  confirmDisabled,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="hstack justify-end gap-3">
      <button className="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
      <button
        className="btn btn-primary"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        Add
      </button>
    </div>
  );
}
