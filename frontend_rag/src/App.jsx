import { useState } from "react";
import { ingestPDF, askQuestion } from "./rag/pipeline.js";
import Sidebar from "./components/Sidebar.jsx";
import Chat from "./components/Chat.jsx";
import Sources from "./components/Sources.jsx";

export default function App() {
  const [docs, setDocs] = useState([]);          // indexed documents
  const [activeId, setActiveId] = useState(null);
  const [progress, setProgress] = useState(null); // { name, stage, pct } while indexing
  const [chats, setChats] = useState({});         // docId -> messages[]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [focusedSource, setFocusedSource] = useState(null); // page number

  const messages = chats[activeId] ?? [];
  const activeDoc = docs.find((d) => d.id === activeId);
  const lastSources = [...messages].reverse().find((m) => m.sources)?.sources ?? [];

  const patchLast = (id, fn) =>
    setChats((c) => ({ ...c, [id]: c[id].map((m, i, a) => (i === a.length - 1 ? fn(m) : m)) }));

  async function handleUpload(file) {
    if (file.type !== "application/pdf") return setError("Only PDF files are supported.");
    setError("");
    setProgress({ name: file.name, stage: "Starting", pct: 0 });
    try {
      const doc = await ingestPDF(file, (stage, pct) => setProgress({ name: file.name, stage, pct }));
      setDocs((d) => [...d, doc]);
      setActiveId(doc.id);
    } catch (e) {
      setError(e.message || "Could not index that PDF.");
    } finally {
      setProgress(null);
    }
  }

  async function handleAsk(question) {
    if (!activeDoc || !activeDoc.name || busy) {
      setError("Select a PDF before asking a question.");
      return;
    }

    const id = activeDoc.id;
    const fileName = activeDoc.name;
    const history = messages.map(({ role, content }) => ({ role, content }));

    setChats((c) => ({
      ...c,
      [id]: [...(c[id] ?? []), { role: "user", content: question }, { role: "assistant", content: "", pending: true }],
    }));
    setBusy(true);
    setError("");

    try {
      const { answer, sources } = await askQuestion(question, fileName, {
        docId: id,
        history,
        onToken: (t) => patchLast(id, (m) => ({ ...m, content: m.content + t })),
      });
      patchLast(id, (m) => ({ ...m, content: answer, sources, pending: false }));
    } catch (e) {
      patchLast(id, (m) => ({ ...m, content: "Something went wrong while answering.", pending: false, failed: true }));
      setError(e.message || "The question failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleRemove(id) {
    setDocs((d) => d.filter((x) => x.id !== id));
    setChats(({ [id]: _, ...rest }) => rest);
    if (activeId === id) setActiveId(docs.find((d) => d.id !== id)?.id ?? null);
    // #TODO delete this document's vectors from your store
  }

  return (
    <div className="app">
      <Sidebar
        docs={docs}
        activeId={activeId}
        progress={progress}
        onSelect={setActiveId}
        onUpload={handleUpload}
        onRemove={handleRemove}
      />
      <Chat
        doc={activeDoc}
        messages={messages}
        busy={busy}
        error={error}
        indexing={!!progress}
        onAsk={handleAsk}
        onCite={setFocusedSource}
        onDismissError={() => setError("")}
      />
      <Sources sources={lastSources} focusedPage={focusedSource} />
    </div>
  );
}
