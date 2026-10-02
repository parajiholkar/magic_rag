const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const API_BASE = "http://localhost:3000/api";

async function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the PDF file."));
    reader.readAsDataURL(file);
  });
}

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

/**
 * @param {File} file  the uploaded PDF
 * @param {(stage: string, pct: number) => void} onProgress
 * @returns {Promise<{ id: string, name: string, pages: number, chunks: number }>} 
 */
export async function ingestPDF(file, onProgress = () => { }) {
  if (!(file instanceof File)) {
    throw new Error("A valid PDF file is required.");
  }

  for (const [stage, pct] of [["Chunking", 35], ["Embedding", 70], ["Indexing", 100]]) {
    onProgress(stage, pct);
    await sleep(250);
  }

  const fileData = await toDataUrl(file);
  const response = await fetch(`${API_BASE}/runPipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      file: fileData,
    }),
  });

  const payload = await parseApiResponse(response);

  return {
    id: crypto.randomUUID(),
    name: payload.name || file.name,
    pages: Number(payload.pages ?? 0),
    chunks: Number(payload.chunks ?? 0),
  };
}

/**
 *
 * @param {string} question
 *  * @param {string} fileName
 * @param {{ docId: string, history: {role: "user"|"assistant", content: string}[], onToken?: (t: string) => void }} opts
 * @returns {Promise<{ answer: string, sources: { page: number, text: string, score: number }[] }>} 
 */
export async function askQuestion(question, fileName, { docId, history = [], onToken } = {}) {
  const response = await fetch(`${API_BASE}/generateAnswer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: question,
      fileName: fileName,
      docId,
      history,
    }),
  });

  const payload = await parseApiResponse(response);
  const answer = payload.message || payload.answer || "Insufficient information.";

  const tokens = answer.split(/(\s+)/);
  for (const token of tokens) {
    onToken?.(token);
    await sleep(18);
  }

  return {
    answer,
    sources: (payload.sources ?? []).map((source) => ({
      page: Number(source.page ?? 1),
      text: source.text ?? "",
      score: Number(source.score ?? 0),
    })),
};
}
