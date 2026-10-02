import { useRef, useState } from "react";

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M4 1.5h5l3.5 3.5v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-12A.5.5 0 0 1 4 1.5Z" />
    <path d="M9 1.5V5h3.5" />
  </svg>
);

export default function Sidebar({ docs, activeId, progress, onSelect, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const pick = (file) => file && onUpload(file);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        <span className="brand-name">Magic RAG</span>
      </div>

      <div
        className={`drop ${over ? "over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      >
        <p className="drop-title">Drop a PDF here</p>
        <p className="drop-sub">or</p>
        <button className="btn" onClick={() => inputRef.current.click()} disabled={!!progress}>
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => { pick(e.target.files[0]); e.target.value = ""; }}
        />
      </div>

      {progress && (
        <div className="progress" role="status">
          <div className="progress-row">
            <span className="truncate">{progress.name}</span>
            <span>{progress.pct}%</span>
          </div>
          <div className="bar"><i style={{ width: `${progress.pct}%` }} /></div>
          <span className="muted small">{progress.stage}…</span>
        </div>
      )}

      <div className="doc-list">
        {docs.length > 0 && <h2 className="side-heading">Library</h2>}
        {docs.map((d) => (
          <div key={d.id} className={`doc ${d.id === activeId ? "active" : ""}`}>
            <button className="doc-main" onClick={() => onSelect(d.id)}>
              <FileIcon />
              <span className="doc-text">
                <span className="truncate doc-name">{d.name}</span>
                <span className="muted small">{d.pages} pages · {d.chunks} chunks</span>
              </span>
            </button>
            <button className="icon-btn" onClick={() => onRemove(d.id)} aria-label={`Remove ${d.name}`}>×</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
