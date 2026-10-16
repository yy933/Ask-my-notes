# Ask My Notes - Personal RAG Knowledge Assistant

An AI-powered search & chat engine for your private docs, built with Next.js, Supabase (pgvector), and Gemini API.

## Live Demo

## Key Feature

## System Architecture Diagram

![System architecture diagram](/public/System%20architecture%20diagram.svg)

## Tech Stack & Architectural Decisions

## Development Roadmap (Completed Checklist)

### Step 1: Environment Setup & Database Schema

- [x] Initialize a new Next.js (App Router) + TypeScript + Tailwind CSS project
- [x] Install and configure `shadcn/ui` (Button, Input, Card, Dialog, Toast, etc.)
- [x] Set up a Supabase project and enable the `pgvector` extension (not enable RLS at this phase for faster development)
- [x] Design and execute Supabase SQL Schema:
  - `documents` table (`id`, `user_id`, `title`, `file_path`, `created_at`)
  - `document_chunks` table (`id`, `document_id`, `content`, `embedding vector(768)`, `metadata`)
- [x] Configure Supabase Client and environment variables (`.env.local`)

### Step 2: File Upload & Chunking Pipeline (Ingestion Engine)

- [x] Build the front-end file upload interface (supporting `.txt` and `.pdf`)
- [x] Implement Server Actions / API Routes to handle file ingestion
- [x] Integrate PDF/TXT parsing libraries (e.g., `pdf-parse`) to extract plain text
- [x] Implement text chunking logic (e.g., 500 characters / chunk with 50-character overlap)
- [x] Connect Google Gemini Embedding API (`text-embedding-004`) to generate embeddings for each chunk

### Step 3: Vector Storage & Hybrid Retrieval

- [x] Store generated text chunks and vector embeddings into Supabase `document_chunks`
- [x] Write Supabase RPC SQL Function (Cosine Similarity Vector Search: `match_documents`)
- [x] Test vector search API to ensure accurate retrieval of top 3–5 relevant chunks for a given query

### Step 4: RAG Chat Interface & Streaming Response

- [x] Develop Chat API Route:
  - Convert user query into embeddings -> Query Supabase for top matching chunks
  - Assemble RAG System Prompt (inject relevant chunks into context for Gemini LLM)
- [x] Implement response streaming (typewriter effect) using `ai` SDK or Gemini API
- [x] Build Chatbot UI (Message list, user input box, loading skeleton/animations)
  - [x] _Subtask 1: State management & layout setup (Message history, input state, shadcn components integration)_
  - [x] _Subtask 2: Frontend streaming receiver (Handle `ReadableStream` and decode typewriter response)_
  - [x] _Subtask 3: UI polish & UX interactions (Auto-scroll to bottom, source citations rendering, loading states)_

### Step 5: Citations, Document Management & UI Polish

- [x] Document Management & List View:
  - [x] Build Document List UI (display file name, uploaded time, processing status, etc.).
  - [x] Implement file deletion feature with sync-deletion support (deleting a document automatically removes its corresponding vector records/chunks and database entries simultaneously).
- [] Source Citations & Preview Modal/Drawer:
  - [] Add "Source Citations" beneath Chatbot responses (referencing document titles and chunk/page indices).
  - [] Implement interactive citations allowing users to click a source badge to open a Modal/Drawer and view the original chunk text.
- [] Global UI Polish & Notifications:
  - [] Implement Toast notifications (for upload success, file deletion, and error handling).
  - [] Add global loading states, error boundaries, and empty states for the document management view.

### Step 6: Deployment, Testing & Security Guardrails

- [ ] Enable Row Level Security (RLS) for multi-tenant data isolation
- [ ] Implement basic guardrails (e.g., file size/type validation, API rate limiting)
- [ ] Deploy production build to Vercel with environment variables
- [ ] Perform End-to-End (E2E) integration testing:
  - [x] Validate file upload & embedding pipeline latency
  - Verify semantic search accuracy and response streaming smoothness

### Step 7: Portfolio Packaging & Documentation

- [x] Draw a concise **System Architecture Diagram** (Mermaid.js / Excalidraw)
- [] Record a 30–45s product demo GIF / video walkthrough
- [] Write a comprehensive, production-grade GitHub `README.md`

## Getting Started / Local Installation

### 🗄️️ Database Setup & Type Generation (Supabase)

This project utilizes **Supabase** integrated with the `pgvector` extension for vector similarity searches and automatic TypeScript type generation.

#### 1. Database Migrations via Supabase CLI

All database schemas, `pgvector` extensions, HNSW indexes, and RPC search functions are version-controlled using Supabase migrations under [`/supabase/migrations`](./supabase/migrations).

To apply these migrations to your Supabase project:

```bash
# 1. Link your local project to your Supabase project
npx supabase link --project-ref <your-project-ref-id>

# 2. Push database migrations to remote
npx supabase db push
```

#### 2. Generate TypeScript Definitions

To ensure full type safety with Supabase Client queries, generate TypeScript types directly from your database schema:

```bash
npx supabase gen types typescript --project-id <your-project-ref-id> > types/database.ts
```

## Testing

This project employs **End-to-End (E2E) Testing** using [Playwright](https://playwright.dev/) to guarantee reliability across document ingestion, vector retrieval, and the conversational RAG pipeline.

### E2E Integration Suite (Playwright)

The E2E suite verifies the critical "Happy Path" of the application, simulating real user interactions with the Next.js frontend, Server/Client Action state processing, Gemini Embedding & LLM generation, and Supabase Vector Database persistence.

#### Verified Scenarios

- **File Upload & Validation:** Ensures `.pdf` and `.txt` files pass validation constraints (e.g., file size limits, MIME types).
- **Ingestion Pipeline:** Verifies full action execution including text extraction, chunking, and vector generation.
- **RAG Chatbot & Streaming Response:**
  - Simulates user queries in the Chat UI (built with React 19 `useActionState` and custom hooks).
  - Verifies real-time `ReadableStream` response streaming (typewriter effect).
  - Validates that Supabase vector retrieval correctly supplies context and dynamically renders interactive **Source Badges** (`[Source X]`) in the UI.
- **Async Feedback & UI State:** Ensures proper loading indicators (`isPending`) and dynamic button/textarea disabling states.

### 🚀 Running Tests Locally

Before running E2E tests, ensure your local development server is running and your `.env.local` contains valid Supabase and Gemini credentials.

```bash
# Option 1: Run tests with Playwright Interactive UI Mode (Recommended for debugging)
npx playwright test --ui

# Option 2: Run tests in headless mode (Command line)
npx playwright test

# Option 3: View HTML execution and trace reports
npx playwright show-report
```

> Note: _Playwright is pre-configured with auto-waiting mechanism to seamlessly accommodate non-blocking Gemini API embedding latencies (up to 15s timeout tolerance per transaction)._
