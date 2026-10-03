import { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = ["Summarize this document", "What are the key takeaways?"];

export default function Chat({ doc, messages, busy, error, indexing, onAsk, onCite, onDismissError }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (q = text) => {
    const v = q.trim();
    if (!v) return;
    setText("");
    onAsk(v);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <main className="chat">
      <header className="chat-head">
        {doc ? (
          <>
            <h1 className="truncate">{doc.name}</h1>
            <span className="pill">Ready</span>
          </>
        ) : (
          <h1>No document selected</h1>
        )}
      </header>

      <section className="thread">
        {!doc && (
          <div className="empty">
            <h2>{indexing ? "Indexing your PDF…" : "Ask your documents anything"}</h2>
            <p>{indexing ? "This takes a moment. You can start asking questions once it finishes." : "Add a PDF from the left. Answers come with the exact pages they were drawn from."}</p>
          </div>
        )}

        {doc && messages.length === 0 && (
          <div className="empty">
            <h2>What would you like to know?</h2>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <article key={i} className={`msg ${m.role} ${m.failed ? "failed" : ""}`}>
            {m.pending && !m.content ? (
              <p className="typing">
                <i /><i /><i />
              </p>
            ) : (
              <div className="msg-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            )}

            {m.sources?.length > 0 && (
              <div className="cites">
                {[...new Set(m.sources.map((s) => s.page))].map((p) => (
                  <button key={p} className="cite" onClick={() => onCite(p)}>
                    p. {p}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        <div ref={endRef} />
      </section>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button onClick={onDismissError} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="composer">
        <textarea
          rows={1}
          value={text}
          disabled={!doc}
          placeholder={doc ? "Ask a question about this PDF" : "Add a PDF to start"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <button className="send" onClick={() => send()} disabled={!doc || busy || !text.trim()}>
          Ask
        </button>
      </div>
    </main>
  );
}
