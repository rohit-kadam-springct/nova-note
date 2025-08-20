"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useChat } from "@/hooks/useChat";

export default function ChatPanel({
  collectionId,
  items,
  onReferenceClick,
}: {
  collectionId: string;
  items: { id: string; type: string; title: string; url?: string | null }[];
  onReferenceClick: (ref: { idx: number; itemId: string; itemType: string; url?: string }) => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [references, setReferences] = useState<
    { idx: number; title: string; url?: string; itemId: string; itemType: string }[]
  >([]);
  const chat = useChat(collectionId);
  const [thinking, setThinking] = useState(false);

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;
    setThinking(true);
    setAnswer("");
    setReferences([]);
    try {
      const res = await chat.mutateAsync(question.trim());
      setAnswer(res.answer);
      setReferences(res.references ?? []);
    } catch {
      setAnswer("Sorry, something went wrong.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="vstack gap-4 w-full max-w-2xl mx-auto">
      {/* Input */}
      <form onSubmit={onSubmit} className="hstack gap-2">
        <input
          className="input flex-1"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={thinking}
        />
        <button className="btn btn-primary" type="submit" disabled={thinking || !question}>
          {thinking ? "Thinking…" : "Ask"}
        </button>
      </form>

      {/* Loading indicator */}
      {thinking && (
        <div className="hstack gap-2 text-muted animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,.28)]" />
          <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,.18)]" />
          <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,.10)]" />
          <span>Looking up your knowledge…</span>
        </div>
      )}

      {/* Answer */}
      {!!answer && (
        <div className="card p-4 vstack gap-2">
          <div className="prose prose-invert max-w-full">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>

              {/* References */}
          {references.length > 0 && (
            <div className="hstack gap-2 flex-wrap mt-2">
              <span className="text-muted text-xs">References:</span>
              {references.map((ref) => (
                <button
                  key={ref.idx}
                  className="btn btn-ghost text-xs"
                  onClick={() =>
                    onReferenceClick(ref)
                  }
                  title={ref.title}
                >
                  [{ref.idx}] {ref.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
