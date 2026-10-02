import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
import dotenv from "dotenv";
import { json } from "express";

dotenv.config();

export default class GenerateAnswer {

    static async getAnswer(req, res) {

        try {

            const query = req.body.query;
            const fileName = req.body.fileName;
            console.log('query', query);

            if (!query || !fileName) {
                return res.status(400).json({
                    status: 400,
                    message: 'Query or FileName Missing...',
                    sources: [],
                });
            }

            const embeddings = new GoogleGenerativeAIEmbeddings({
                modelName: "gemini-embedding-2",
                apiKey: process.env.GOOGLE_API_KEY,
            });

            const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                url: process.env.QDRANT_URL,
                collectionName: fileName,
            });


            const search_results = await vectorStore.similaritySearch(query);

            const contextText = search_results
                .map((doc) => doc.pageContent)
                .join('\n\n---\n\n');

            const system_prompt = `You are a helpful AI assistant who responds strictly based on the provided context. If the answer is not present in the context, respond with "Insufficient information."`;

            const messages = [
                { role: 'system', content: system_prompt },
                {
                    role: 'user',
                    content: `Context:\n${contextText}\n\nQuestion: ${query}`,
                },
            ];

            const client = new OpenAI({
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
                apiKey: process.env.GOOGLE_API_KEY,
            });

            const response = await client.chat.completions.create({
                model: process.env.GOOGLE_GEMINI_MODEL,
                messages,
            });

            return res.status(200).json({
                status: 200,
                message: response.choices[0].message.content,
                sources: search_results.map((doc) => {
                    return {
                        page: doc.metadata.loc.pageNumber,
                        text: doc.pageContent,
                        score: 0.80
                    };
                }),
            });

        } catch (error) {
            console.error('Error Generating Answer:', error);
            return res.status(500).json({
                status: 500,
                message: 'Error Generating Answer',
                error: error.message,
            });
        }

    }
}