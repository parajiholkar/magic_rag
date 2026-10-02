const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {File} file  the uploaded PDF
 * @param {(stage: string, pct: number) => void} onProgress
 * @returns {Promise<{ id: string, name: string, pages: number, chunks: number }>}
 */
export async function ingestPDF(file, onProgress = () => { }) {

  for (const [stage, pct] of [["Chunking", 50], ["Embedding", 80], ["Indexing", 100]]) {
    onProgress(stage, pct);
    await sleep(500);
  }
  return { id: crypto.randomUUID(), name: file.name, pages: 12, chunks: 48 };
}

/**
 *
 * @param {string} question
 * @param {{ docId: string, history: {role: "user"|"assistant", content: string}[], onToken?: (t: string) => void }} opts
 * @returns {Promise<{ answer: string, sources: { page: number, text: string, score: number }[] }>}
 */
export async function askQuestion(question, { docId, history = [], onToken } = {}) {
  
  await sleep(900);
  const answer = "This is a placeholder answer. Wire up askQuestion() in src/rag/pipeline.js to see real answers grounded in your PDF.";
  for (const word of answer.split(" ")) {
    onToken?.(word + " ");
    await sleep(35);
  }
  return {
    answer,
    sources: [
      { page: 3, text: "Placeholder passage retrieved from the document. Your retrieved chunk text will appear here.", score: 0.82 },
      { page: 7, text: "Another placeholder passage, ranked lower by similarity.", score: 0.64 },
    ],
  };
}
