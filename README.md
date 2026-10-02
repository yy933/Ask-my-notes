# Ask My Notes - Personal RAG Knowledge Assistant 
An AI-powered search & chat engine for your private docs, built with Next.js, Supabase (pgvector), and Gemini API.

## Live Demo

## Key Feature

## System Architecture Diagram
![System architecture diagram](/public/System%20architecture%20diagram.svg)

## Tech Stack & Architectural Decisions

## Development Roadmap (Completed Checklist)

### Step 1: Environment Setup & Database Schema
- [] Initialize a new Next.js (App Router) + TypeScript + Tailwind CSS project
- [] Install and configure `shadcn/ui` (Button, Input, Card, Dialog, Toast, etc.)
- [] Set up a Supabase project and enable the `pgvector` extension
- [] Design and execute Supabase SQL Schema:
  - `documents` table (`id`, `user_id`, `title`, `file_path`, `created_at`)
  - `document_chunks` table (`id`, `document_id`, `content`, `embedding vector(768)`, `metadata`)
- [x] Configure Supabase Client and environment variables (`.env.local`)

### Step 2: File Upload & Chunking Pipeline (Ingestion Engine)
- [] Build the front-end file upload interface (supporting `.txt` and `.pdf`)
- [] Implement Server Actions / API Routes to handle file ingestion
- [] Integrate PDF/TXT parsing libraries (e.g., `pdf-parse`) to extract plain text
- [] Implement text chunking logic (e.g., 500 characters / chunk with 50-character overlap)
- [] Connect Google Gemini Embedding API (`text-embedding-004`) to generate embeddings for each chunk

### Step 3: Vector Storage & Hybrid Retrieval
- [] Store generated text chunks and vector embeddings into Supabase `document_chunks`
- [] Write Supabase RPC SQL Function (Cosine Similarity Vector Search: `match_documents`)
- [] Test vector search API to ensure accurate retrieval of top 3–5 relevant chunks for a given query

### Step 4: RAG Chat Interface & Streaming Response
- [] Build Chatbot UI (Message list, user input box, loading skeleton/animations)
- [] Develop Chat API Route:
  - Convert user query into embeddings -> Query Supabase for top matching chunks
  - Assemble RAG System Prompt (inject relevant chunks into context for Gemini LLM)
- [] Implement response streaming (typewriter effect) using `ai` SDK or Gemini API

### Step 5: Citations & UI Polish
- [] Add **"Source Citations"** beneath Chatbot responses (referencing document title and chunk/page index)
- [] Allow users to click citations to open a Modal/Drawer and view the original chunk text
- [] Implement Toast notifications (upload success, error handling) and global loading states
- [] Build Document List view: display uploaded files with sync-deletion support (removes vector records simultaneously)

### Step 6: Deployment, Testing & Guardrails
- [] Deploy project to Vercel and configure production environment variables
- [] End-to-end integration testing: Upload multiple PDF/TXT files, query chatbot, and verify response accuracy and stream latency
- [] Implement basic guardrails (e.g., file size limits, API rate limiting)

### Step 7: Portfolio Packaging & Documentation
- [x] Draw a concise **System Architecture Diagram** (Mermaid.js / Excalidraw)
- [] Record a 30–45s product demo GIF / video walkthrough
- [] Write a comprehensive, production-grade GitHub `README.md`

## Getting Started / Local Installation