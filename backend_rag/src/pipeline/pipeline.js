import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import dotenv from "dotenv";

dotenv.config();

export default class Pipeline {
    static getPdfBuffer(req) {
        if (req.file?.buffer) return req.file.buffer;
        if (Buffer.isBuffer(req.body)) return req.body;
        if (Buffer.isBuffer(req.raw)) return req.raw;

        if (typeof req.body === 'string') {
            if (req.body.startsWith('data:application/pdf;base64,')) {
                return Buffer.from(req.body.split(',')[1], 'base64');
            }
            return Buffer.from(req.body, 'utf8');
        }

        if (req.body && typeof req.body === 'object') {
            if (Buffer.isBuffer(req.body.file)) return req.body.file;
            if (typeof req.body.file === 'string') {
                if (req.body.file.startsWith('data:application/pdf;base64,')) {
                    return Buffer.from(req.body.file.split(',')[1], 'base64');
                }
                return Buffer.from(req.body.file, 'utf8');
            }
            if (typeof req.body.data === 'string' && req.body.data.startsWith('data:application/pdf;base64,')) {
                return Buffer.from(req.body.data.split(',')[1], 'base64');
            }
        }

        if (req.body instanceof Uint8Array) return Buffer.from(req.body);
        if (req.body instanceof ArrayBuffer) return Buffer.from(req.body);

        return null;
    }

    static async runPipeline(req, res) {
        try {
            const pdfBuffer = this.getPdfBuffer(req);

            if (!pdfBuffer || pdfBuffer.length === 0) {
                return res.status(400).json({
                    status: 400,
                    message: 'No PDF file was sent in the request body.'
                });
            }

            const fileName = req.body.fileName;

            const blob = new Blob([pdfBuffer], { type: "application/pdf" });

            const loader = new PDFLoader(blob);
            const docs = await loader.load();
            // console.log('docs', { docs });

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1200,
                chunkOverlap: 200,
            });

            const splitDocs = await splitter.splitDocuments(docs);
            // console.log('apiKey', process.env.GOOGLE_API_KEY);

            const embeddings = new GoogleGenerativeAIEmbeddings({
                modelName: "gemini-embedding-2",
                apiKey: process.env.GOOGLE_API_KEY,
            });

            const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                url: process.env.QDRANT_URL,
                collectionName: fileName,
            });

            await vectorStore.addDocuments(splitDocs);

            return res.status(200).json({
                status: 200,
                message: 'PDF processed successfully',
                name: fileName,
                pages: docs.length,
                chunks: splitDocs.length
            });
        } catch (error) {
            console.error('Error processing PDF:', error);
            return res.status(500).json({
                status: 500,
                message: 'Error processing PDF',
                error: error.message,
            });
        }
    }
}