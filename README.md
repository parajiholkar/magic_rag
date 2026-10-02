# 🪄 Magic RAG

**Magic RAG** is a production-ready Retrieval-Augmented Generation (RAG) system built with Node.js. It indexes documents into vector embeddings and performs semantic similarity search to ground Large Language Model (LLM) responses strictly in your custom data, eliminating hallucinations.

---

## ⚡ Key Features

- **Semantic Similarity Search:** Leverages vector store search to retrieve the most contextually relevant chunks for any query.
- **Hallucination Guardrails:** Strict prompt boundary engineering ensures the model answers only using retrieved facts, gracefully falling back when data is missing.
- **Google Gemini:** Seamlessly integrates Google's Gemini models using the SDK-compatible endpoint.
- **Modular Pipeline:** Clean separation of document ingestion, vector retrieval, and contextual answer generation.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Container:** Docker Container
- **LLM Provider:** Google Gemini (`gemini-3.5-flash`)
- **API Client:** OpenAI Node SDK (pointing to Google Generative Language endpoint)
- **Vector Search:** LangChain / Vector Store Integration
- **Vector Database:** qdrant

---

## 🚀 How It Works

1. **Query:** User submits a prompt or question.
2. **Retrieve:** The system performs a vector similarity search across pre-indexed embeddings.
3. **Augment:** Retrieved document chunks (`pageContent`) are compiled into structured context blocks.
4. **Generate:** The query and contextual evidence are passed to Gemini with a grounded system prompt to formulate the final verified response.

---