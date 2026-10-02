export default function Sources({ sources, focusedPage }) {
  return (
    <aside className="sources">
      <h2 className="side-heading">Retrieved passages</h2>
      {sources.length === 0 ? (
        <p className="muted small">Passages used for each answer will show up here, with their similarity score.</p>
      ) : (
        sources.map((s, i) => (
          <div key={i} className={`src ${s.page === focusedPage ? "focus" : ""}`}>
            <div className="src-top">
              <strong>Page {s.page}</strong>
              <span className="muted small">{Math.round(s.score * 100)}% match</span>
            </div>
            <div className="bar thin"><i style={{ width: `${s.score * 100}%` }} /></div>
            <p>{s.text}</p>
          </div>
        ))
      )}
    </aside>
  );
}
