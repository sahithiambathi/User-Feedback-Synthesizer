# User Feedback Synthesizer

An AI system that learns from continuous user feedback over time using **Hindsight persistent memory** and **Groq LLM reasoning**.
## Live Demo

🌐 [Open User Feedback Synthesizer](https://user-feedback-synthesizer-qy3d3ja38-the-tulips.vercel.app/)

## Core Value & Architecture

* **Continuous Feedback** is ingested through `/feedback` and immediately retained into persistent Hindsight memory.
* **Groq Intelligence** (`openai/gpt-oss-120b`) categorizes theme, sentiment, severity, and generates structured analysis.
* **Persistent Memory** retains both raw user comments and enriched analyses with metadata and tags in Hindsight bank `feedback-synthesizer`.
* **Synthesized Insights** (`/insights`) clusters recurring friction points, persistent issues, emerging problems, and improving trends directly from recalled memories.
* **Product Decisions** (`/decisions`) records roadmap interventions into memory with the `decision` tag to close the feedback loop.
* **Ask Memory** (`/ask-memory`) enables natural language querying where Groq synthesizes answers grounded strictly in recalled historical evidence.

```
Feedback
  ↓ (Hindsight retain)
Persistent Memory (Hindsight Bank: feedback-synthesizer)
  ↓ (Hindsight recall)
Groq Synthesis / Reasoning
  ↓
Useful Product Insights (/insights)
  ↓
Product Decision / Action Taken (/decisions)
  ↓ (Hindsight retain with tag: decision)
Later Feedback
  ↓ (Hindsight recall: historical feedback + decisions)
Contextual Understanding & Grounded Answers (/ask-memory)
```

---

## Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
* **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic Settings
* **AI Engine**: Groq API (`groq` Python SDK, model: `openai/gpt-oss-120b`)
* **Persistent Memory**: Hindsight (`hindsight-client`, endpoint: `https://api.hindsight.vectorize.io`, bank ID: `feedback-synthesizer`)

---

## Directory Structure

```
User Feedback Synthesizer/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                    # FastAPI application & CORS config
│       ├── core/
│       │   └── config.py              # Environment settings (Groq, Hindsight)
│       ├── services/
│       │   ├── groq_service.py        # Groq completion service
│       │   └── hindsight_service.py   # Hindsight retain/recall/list service
│       └── api/
│           └── routes.py              # Endpoints: feedback, insights, decisions, ask, dashboard
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx             # Root layout with sidebar and header
        │   ├── page.tsx               # Dashboard with live metrics & feeds
        │   ├── feedback/page.tsx      # Ingestion form & remembered feedback feed
        │   ├── insights/page.tsx      # Synthesized patterns & thematic clusters
        │   ├── decisions/page.tsx     # Decision logger & remembered decisions feed
        │   └── ask-memory/page.tsx    # Grounded Q&A with recalled evidence inspection
        └── components/
            ├── Header.tsx             # Top status bar (API, Bank, Model status)
            └── Sidebar.tsx            # Navigation sidebar
```

---

## End-to-End Demo Story

The application supports this realistic product management workflow:

### Step 1: Historical User Feedback
Submit the following on the **Feedback** page (`/feedback`):
1. `"Checkout is confusing."`
2. `"I couldn't find the coupon field."`
3. `"There are too many steps in checkout."`

*Groq analyzes sentiment/theme and Hindsight persists the memories.*

### Step 2: Record Product Decision
On the **Decisions** page (`/decisions`), record:
* **Decision**: `"Move the coupon field to the checkout header."`
* **Theme**: `"Checkout friction"`
* **Rationale**: `"Users repeatedly reported difficulty finding coupons."`

*Hindsight retains the decision with the `decision` tag.*

### Step 3: Later User Feedback
Submit follow-up feedback on the **Feedback** page (`/feedback`):
1. `"Checkout is much easier now."`
2. `"Finally found the coupon immediately."`
3. `"Mobile payment is still confusing."`

### Step 4: Ask Persistent Memory
On the **Ask Memory** page (`/ask-memory`), ask:
> **"Did our checkout improvement actually work?"**

*Hindsight recalls both historical feedback and the recorded decision. Groq synthesizes an evidence-backed answer explaining that coupon discovery was resolved, while general checkout steps and mobile payment confusion remain.*

---

## Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/status` | Configuration status for Groq and Hindsight |
| `GET` | `/api/dashboard` | Aggregated metrics, recent feedback, and decisions |
| `POST` | `/api/feedback` | Ingest user feedback, analyze with Groq, retain in Hindsight |
| `GET` | `/api/feedback` | Recall feedback memories from Hindsight (optional `?query=`) |
| `GET` | `/api/insights` | Synthesize themes, persistent/emerging/improving issues |
| `POST` | `/api/decisions` | Record product decision into Hindsight |
| `GET` | `/api/decisions` | Recall past product decisions from Hindsight |
| `POST` | `/api/ask` | Answer product questions grounded strictly in Hindsight memories |
| `POST` | `/api/memory/test` | Test Hindsight retain and recall integration |
| `POST` | `/api/ai/test` | Test Groq completion integration |

---

## How to Run Locally

### 1. Run Backend (FastAPI)

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* API runs at: `http://localhost:8000`
* Interactive API Docs: `http://localhost:8000/docs`

### 2. Run Frontend (Next.js)

```powershell
cd frontend
npm run dev
```

* Frontend runs at: `http://localhost:3000`
