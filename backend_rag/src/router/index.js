import express from 'express';
import asyncHandler from '../middelware/asyncHandler.js';
import Pipeline from '../pipeline/pipeline.js';
import GenerateAnswer from '../generate_answer/generate_answer.js'

const router = express.Router();

router.post('/runPipeline', asyncHandler((req, res) => Pipeline.runPipeline(req, res)));
router.post('/generateAnswer', asyncHandler((req, res) => GenerateAnswer.getAnswer(req, res)));

export default router;