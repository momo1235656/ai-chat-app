# AI Chat - Project Specification

## Project Overview

A general-purpose AI chat assistant built with Next.js, powered by Claude API via the Mastra agent framework. Publicly accessible without authentication. Guest users are identified by a browser-local UUID stored in localStorage, enabling persistent conversation history per device.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | Next.js API Routes |
| Styling | Tailwind CSS |
| Database | MongoDB |
| AI Framework | Mastra |
| AI Model | claude-sonnet-4-6 |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Hosting | Google Cloud Run |

---

## Architecture

```
Browser
  └── Next.js App (App Router)
        ├── UI Layer (React + Tailwind)
        │     ├── Sidebar (conversation thread list)
        │     └── Chat Window (message list + input)
        └── API Routes
              └── /api/chat  →  Mastra Agent  →  Claude API
                                                        ↕
                                                    MongoDB
                                              (conversations, messages)
```

**Guest user identification:**
- On first visit, a UUID (`guestId`) is generated and stored in `localStorage`.
- All API requests include this `guestId` to scope conversations.

---

## Core Features

### MVP (Phase 1)
- [x] Guest user identification via `localStorage` UUID
- [x] ChatGPT-style UI: sidebar (thread list) + main chat window
- [x] Send messages and receive responses from Claude (non-streaming)
- [x] Persistent conversation history stored in MongoDB
- [x] Create new conversation threads
- [x] Load past conversation threads from sidebar

### Future (Phase 2)
- [ ] Streaming responses
- [ ] Mastra tool/agent integrations (web search, external APIs, etc.)
- [ ] File upload (PDF, images)
- [ ] User authentication

---

## Directory Structure

```
ai-chat/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Redirects to /chat
│   └── chat/
│       ├── page.tsx                # Main chat page
│       └── [conversationId]/
│           └── page.tsx            # Chat thread view
├── components/
│   ├── Sidebar.tsx                 # Conversation list
│   ├── ChatWindow.tsx              # Message display area
│   ├── MessageBubble.tsx           # Individual message
│   └── ChatInput.tsx               # Input box + send button
├── lib/
│   ├── mongodb.ts                  # MongoDB client singleton
│   ├── mastra.ts                   # Mastra agent setup
│   └── guestId.ts                  # localStorage UUID helper
├── app/api/
│   ├── chat/
│   │   └── route.ts                # POST /api/chat
│   └── conversations/
│       ├── route.ts                # GET (list) / POST (create)
│       └── [id]/
│           └── route.ts            # GET messages by conversation
├── models/
│   ├── Conversation.ts             # MongoDB schema
│   └── Message.ts                  # MongoDB schema
├── .env.local                      # Local environment variables
├── Dockerfile
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline
└── CLAUDE.md
```

---

## Data Models

### Conversation
```ts
{
  _id: ObjectId,
  guestId: string,        // localStorage UUID
  title: string,          // Auto-generated from first message
  createdAt: Date,
  updatedAt: Date
}
```

### Message
```ts
{
  _id: ObjectId,
  conversationId: ObjectId,
  role: "user" | "assistant",
  content: string,
  createdAt: Date
}
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/conversations` | List all conversations for a guestId |
| POST | `/api/conversations` | Create a new conversation |
| GET | `/api/conversations/[id]` | Get messages for a conversation |
| POST | `/api/chat` | Send a message and get AI response |

### POST /api/chat — Request Body
```json
{
  "conversationId": "string",
  "guestId": "string",
  "message": "string"
}
```

### POST /api/chat — Response
```json
{
  "reply": "string",
  "messageId": "string"
}
```

---

## Mastra Agent Setup

Mastra is configured as the agent layer between the API route and Claude. For Phase 1, it acts as a simple LLM wrapper. Tools and integrations will be added in Phase 2.

```ts
// lib/mastra.ts
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import Anthropic from "@anthropic-ai/sdk";

export const chatAgent = new Agent({
  name: "chat-agent",
  model: {
    provider: "anthropic",
    name: "claude-sonnet-4-6",
  },
  instructions: "You are a helpful general-purpose assistant.",
  tools: {}, // Add tools in Phase 2
});
```

---

## Environment Variables

### `.env.local` (local dev)
```
ANTHROPIC_API_KEY=your_anthropic_api_key
MONGODB_URI=mongodb+srv://...
```

### Google Cloud Run (production)
Set via Cloud Run environment variables or Secret Manager:
- `ANTHROPIC_API_KEY`
- `MONGODB_URI`
- `NODE_ENV=production`

---

## Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Requires `output: "standalone"` in `next.config.ts`.

---

## CI/CD — GitHub Actions

**Trigger:** Push to `main` branch
**Pipeline:**
1. Run lint + type check
2. Build Docker image
3. Push to Google Artifact Registry
4. Deploy to Cloud Run

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud auth configure-docker
      - run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/ai-chat:$GITHUB_SHA .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/ai-chat:$GITHUB_SHA
      - run: |
          gcloud run deploy ai-chat \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/ai-chat:$GITHUB_SHA \
            --region asia-northeast1 \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars NODE_ENV=production
```

### Required GitHub Secrets
- `GCP_SA_KEY` — GCP service account JSON key
- `GCP_PROJECT_ID` — Google Cloud project ID

---

## UI Design

- **Layout:** ChatGPT-style — fixed sidebar (left) + main chat area (right)
- **Language:** English
- **Sidebar:** Lists conversation threads by `updatedAt` desc, "New Chat" button at top
- **Chat window:** Scrollable message history, input box pinned to bottom
- **Message bubbles:** User messages right-aligned, assistant messages left-aligned
- **Theme:** Dark mode preferred (Tailwind `dark:` classes)

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Build Docker image locally
docker build -t ai-chat .
docker run -p 3000:3000 --env-file .env.local ai-chat
```

---

## Implementation Notes

- Use MongoDB connection singleton (`lib/mongodb.ts`) to avoid connection exhaustion in serverless environments.
- `guestId` is generated client-side with `crypto.randomUUID()` and persisted in `localStorage`.
- Conversation title is auto-generated from the first 50 characters of the user's first message.
- Keep Mastra tools array empty (`tools: {}`) for Phase 1; add tools incrementally in Phase 2.
- Use `next.config.ts` with `output: "standalone"` for Docker compatibility.
