# AI Chat — Implementation TODO

## Phase 1: Project Setup

### 1.1 Initialize Repository
- [ ] Create GitHub repository
- [x] Run `npx create-next-app@latest ai-chat --typescript --tailwind --app --eslint`
- [x] Confirm `next.config.ts` exists (will be edited later)
- [x] Delete boilerplate files (`app/page.tsx` default content, `app/globals.css` defaults)
- [x] Create `.gitignore` entries for `.env.local`

### 1.2 Install Dependencies
- [x] `npm install @mastra/core @mastra/anthropic`
- [x] `npm install mongoose`
- [x] `npm install uuid`
- [x] `npm install -D @types/uuid`

### 1.3 Environment Variables
- [x] Create `.env.local` with:
  - `ANTHROPIC_API_KEY`
  - `MONGODB_URI`
- [x] Verify `.env.local` is in `.gitignore`

---

## Phase 2: Infrastructure & Config

### 2.1 MongoDB (Atlas)
- [ ] Create MongoDB Atlas account / project
- [ ] Create a free-tier cluster (M0)
- [ ] Add database user with read/write access
- [ ] Whitelist IP (`0.0.0.0/0` for Cloud Run)
- [ ] Copy connection string to `MONGODB_URI`

### 2.2 Next.js Config
- [x] Edit `next.config.ts` — add `output: "standalone"`

### 2.3 Google Cloud Setup
- [ ] Create GCP project
- [ ] Enable APIs: Cloud Run, Artifact Registry, Cloud Build
- [ ] Create Artifact Registry repository (Docker)
- [ ] Create Service Account with roles:
  - `roles/run.admin`
  - `roles/artifactregistry.writer`
  - `roles/iam.serviceAccountUser`
- [ ] Download Service Account JSON key
- [ ] Add GitHub Secrets:
  - `GCP_SA_KEY` (JSON key content)
  - `GCP_PROJECT_ID`

---

## Phase 3: Backend Implementation

### 3.1 MongoDB Client Singleton
- [x] Create `lib/mongodb.ts`
  - Connect via `mongoose`
  - Cache connection to avoid exhaustion in serverless

### 3.2 Data Models
- [x] Create `models/Conversation.ts`
  - Fields: `guestId`, `title`, `createdAt`, `updatedAt`
- [x] Create `models/Message.ts`
  - Fields: `conversationId`, `role` (`"user" | "assistant"`), `content`, `createdAt`

### 3.3 Mastra Agent
- [x] Create `lib/mastra.ts`
  - Initialize `Agent` with `claude-sonnet-4-6`
  - Set system instructions: `"You are a helpful general-purpose assistant."`
  - Leave `tools: {}` empty for Phase 1

### 3.4 Guest ID Helper
- [x] Create `lib/guestId.ts`
  - `getOrCreateGuestId()` — reads from `localStorage`, creates `crypto.randomUUID()` if absent

### 3.5 API Routes
- [x] `app/api/conversations/route.ts`
  - `GET` — query conversations by `guestId`, sort by `updatedAt` desc
  - `POST` — create new conversation, auto-title from first 50 chars of first message
- [x] `app/api/conversations/[id]/route.ts`
  - `GET` — return all messages for a `conversationId`
- [x] `app/api/chat/route.ts`
  - `POST` — receive `{ conversationId, guestId, message }`
  - Save user message to MongoDB
  - Fetch conversation history, send to Mastra agent
  - Save assistant reply to MongoDB
  - Update `conversation.updatedAt`
  - Return `{ reply, messageId }`

---

## Phase 4: Frontend Implementation

### 4.1 Layout
- [x] Edit `app/layout.tsx` — dark background, base font, full-height body

### 4.2 Pages
- [x] `app/page.tsx` — redirect to `/chat`
- [x] `app/chat/page.tsx` — new conversation entry point (auto-create or show empty state)
- [x] `app/chat/[conversationId]/page.tsx` — load and display a conversation

### 4.3 Components
- [x] `components/Sidebar.tsx`
  - "New Chat" button at top
  - List conversations sorted by `updatedAt` desc
  - Highlight active conversation
  - Fetch from `GET /api/conversations`
- [x] `components/ChatWindow.tsx`
  - Scrollable message list
  - Auto-scroll to bottom on new message
  - Loading indicator while waiting for response
- [x] `components/MessageBubble.tsx`
  - User: right-aligned, accent color bubble
  - Assistant: left-aligned, neutral bubble
- [x] `components/ChatInput.tsx`
  - Textarea (expands with content)
  - Send button
  - Submit on `Enter` (Shift+Enter for newline)
  - Disable while request is in flight

### 4.4 State & Data Fetching
- [x] Initialize `guestId` on app load via `lib/guestId.ts`
- [x] Pass `guestId` in all API request headers or body
- [x] Handle loading and error states for all API calls

---

## Phase 5: Docker

- [x] Create `Dockerfile` (multi-stage: deps → builder → runner)
- [x] Create `.dockerignore` (`node_modules`, `.next`, `.env*`)
- [ ] Test local Docker build:
  ```bash
  docker build -t ai-chat .
  docker run -p 3000:3000 --env-file .env.local ai-chat
  ```
- [ ] Verify app works inside container at `http://localhost:3000`

---

## Phase 6: CI/CD — GitHub Actions

- [x] Create `.github/workflows/deploy.yml`
  - Trigger: push to `main`
  - Steps: checkout → GCP auth → Docker build → push to Artifact Registry → deploy to Cloud Run
- [x] Set Cloud Run region: `asia-northeast1` (Tokyo)
- [x] Set `--allow-unauthenticated` flag on Cloud Run service
- [x] Set environment variables on Cloud Run:
  - `ANTHROPIC_API_KEY`
  - `MONGODB_URI`
  - `NODE_ENV=production`
- [ ] Push to `main` and verify pipeline succeeds
- [ ] Confirm deployed URL is accessible

---

## Phase 7: Manual QA Checklist

- [ ] First visit generates and stores `guestId` in `localStorage`
- [ ] "New Chat" creates a new conversation in MongoDB
- [ ] Sending a message returns an AI response
- [ ] Conversation title is auto-set from first message
- [ ] Refreshing the page restores the conversation
- [ ] Switching threads in sidebar loads correct history
- [ ] Multiple conversations are isolated per thread
- [ ] Dark mode renders correctly on all components
- [ ] Input is disabled while response is loading
- [ ] App works correctly inside Docker container
- [ ] Deployed Cloud Run URL is publicly accessible

---

## Backlog (Phase 2)

- [ ] Streaming responses (SSE / ReadableStream)
- [ ] Mastra tool integrations (web search, calculator, etc.)
- [ ] Markdown rendering for assistant messages
- [ ] File upload (PDF, images)
- [ ] User authentication (NextAuth.js or Clerk)
- [ ] Conversation deletion
- [ ] Conversation rename
- [ ] Mobile responsive layout
