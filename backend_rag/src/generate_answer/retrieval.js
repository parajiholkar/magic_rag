import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";

export default async function getSimilarityResults(query, fileName) {

    const embeddings = new GoogleGenerativeAIEmbeddings({
        modelName: "gemini-embedding-2",
        apiKey: process.env.GOOGLE_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: fileName,
    });

    const search_results = await vectorStore.similaritySearch(query);

    return search_results;
}