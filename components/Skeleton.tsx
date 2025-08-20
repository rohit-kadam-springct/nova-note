export function SkeletonCard() {
  return <div className="card p-4 h-32 animate-pulse bg-[rgba(255,255,255,.07)]" />;
}

export function SkeletonLine({ height = "h-6" }) {
  return <div className={`bg-[rgba(255,255,255,.08)] rounded ${height} animate-pulse`} />;
}