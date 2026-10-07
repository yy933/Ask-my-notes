import { GoogleGenAI } from '@google/genai';

// Gemini API initialization
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
