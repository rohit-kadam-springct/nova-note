export default function Home() {
  return (
    <main className="container py-8">
      <section className="vstack gap-6">
        <header className="vstack gap-2">
          <h1 className="text-3xl font-bold">NovaNote</h1>
          <p className="text-muted">AI-powered knowledge notebook. POC build.</p>
        </header>

        <div className="card p-4 vstack">
          <p>Collections will appear here.</p>
          <div className="hstack">
            <button className="btn btn-primary">Create Collection</button>
            <button className="btn btn-ghost">Learn more</button>
          </div>
        </div>
      </section>
    </main>
  );
}