import OpenAI from "openai";
import dotenv from "dotenv";
import { json } from "express";
import getSimilarityResults from "./retrieval.js";

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

            const client = new OpenAI({
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
                apiKey: process.env.GOOGLE_API_KEY,
            });

            const system_prompt = `You are a AI assistant who work on less Abtraction of user query.
            you carefully analyze user query and Generate 3 more queries which is less abtraction form of user query.
            
            Rules:
            - You only generate queries related to original user query.
            - Strictly avoid unnecessary and unrelated querise (if user query is related to NodeJS then you create queries related to NodeJS only).
            - Generate Strictly 3 queries.
            
            Output: 
            - Strictly JSON format and no markup or other output format.
            - { "queries": [ "query 1", "query 2", "query 3", ]}

            Examples:
              1. user query: "FileName:docker notes.pdf\n\nQuery: tell me about docker ?"
               - AI assistant: { "queries": [ "what is docker ?", "what is docker demon and docker container ?", "how to use docker ?", ]}
              2. user query: "FileName:Quarterly_Financial_Report_Q3.pdf\n\nQuery: can you summarize this document for me?"
               - AI assistant: { "queries": [ "executive summary Q3 financial performance", "key financial highlights revenue and net profit Q3", "major operational challenges and future outlook Q3" ] }
              3. user query: "FileName:Employee_Handbook_2025.pdf\n\nQuery: how do I apply for parental leave and what is the policy?"
               - AI assistant: { "queries": [ "parental leave eligibility and policy guidelines", "parental leave duration and compensation structure", "step by step procedure to submit a leave request" ] }
            `;

            const messages = [
                { role: 'system', content: system_prompt },
                {
                    role: 'user',
                    content: `FileName:\n${fileName}\n\nQuery: ${query}`,
                },
            ];

            const response = await client.chat.completions.create({
                model: process.env.GOOGLE_GEMINI_MODEL,
                messages,
                response_format: { type: "json_object" },
            });

            const rawContent = response.choices[0].message.content;
            const parsed = JSON.parse(rawContent);
            const queries = Array.isArray(parsed.queries) ? parsed.queries : [];

            console.log('queries', queries);


            const nestedResults = await Promise.all(
                queries.map((q) => getSimilarityResults(q, fileName))
            );


            const flattenedResults = nestedResults.flat();

            const uniqueResults = Array.from(
                new Map(
                    flattenedResults.map((item) => [
                        item.id ?? item.text ?? item.pageContent ?? JSON.stringify(item),
                        item
                    ])
                ).values()
            );

            const contextText = uniqueResults
                .map((doc) => doc.pageContent)
                .join('\n\n---\n\n');

            const system_prompt_2 = `You are AI assistant for a Retrieval-Augmented Generation (RAG) system. Your sole task is to answer user queries using the provided context.

            Rules:
            - Grounding: Base your answer on the provided context. Do not use outside knowledge or extrapolate beyond what is provided.
            - Hallucination Prevention: If the provided context does not contain enough information to answer the question, state: "I don't have enough information in the provided document to answer that question."
            - Accuracy & Tone: Be concise, clear, and direct. Retain technical terms, numbers, and facts exactly as shown in the context.
            - Document Synthesis: If the context contains multiple relevant chunks, synthesize them cleanly without repeating duplicate information.
            - No Assumptions: Do not assume details, speculate, or mention terms like "based on chunk 1" or "according to the context" unless quoting directly.

            Examples:
            1. User Query: "What is the memory limit for our Lambda functions?"
            Context: "<context>Our AWS Lambda functions are configured with a default timeout of 30 seconds and run on Node.js 20.x.</context>"
            - AI assistant: "I don't have enough information in the provided document to answer that question. but I got this information ...."

            2. User Query: "How do I trigger a production deployment?"
            Context: "<context>Production deployments require a merged PR into 'main'. Once merged, run 'npm run deploy:prod' in the CLI, which triggers the AWS CDK pipeline.</context>"
            - AI assistant: "To trigger a production deployment, merge your pull request into the 'main' branch, then execute 'npm run deploy:prod' in your CLI to trigger the AWS CDK pipeline."

            3. User Query: "Summarize the key updates in Q3."
            Context: "<context>Q3 revenue grew by 14% year-over-year. The engineering team migrated all auth services to OAuth 2.0. However, APAC sales dropped by 4% due to currency fluctuations.</context>"
            - AI assistant: "Key Q3 updates:
            - Revenue increased 14% year-over-year.
            - Auth services completed migration to OAuth 2.0.
            - APAC sales decreased by 4% due to currency headwinds."
            `;
            const messagesForGeneration = [
                { role: 'system', content: system_prompt_2 },
                {
                    role: 'user',
                    content: `Context:\n<context>\n${contextText}\n</context>\n\nQuery: ${query}`,
                },
            ];

            const responseFinal = await client.chat.completions.create({
                model: process.env.GOOGLE_GEMINI_MODEL,
                messages: messagesForGeneration,
            });

            return res.status(200).json({
                status: 200,
                message: responseFinal.choices[0].message.content,
                sources: uniqueResults.map((doc) => {
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