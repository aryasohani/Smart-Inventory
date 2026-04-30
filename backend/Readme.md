# 🏪 SmartStore AI — Intelligent Inventory & Vendor Management Platform

> Production-grade FastAPI backend with real AI tool-calling, automated scheduling, OCR invoice parsing, and demand forecasting.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SmartStore AI Backend                        │
│                                                                     │
│  ┌──────────┐  ┌──
────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  /auth   │  │ /products│  │/suppliers│  │ /purchase-orders   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘ │
│       │              │              │                  │             │
│  ┌────▼──────────────▼──────────────▼──────────────────▼──────────┐│
│  │                     Services Layer                               ││
│  │   AuthService  ProductService  SupplierService  POService       ││
│  └────────────────────────────┬─────────────────────────────────── ┘│
│                               │                                     │
│  ┌────────────────────────────▼─────────────────────────────────── ┐│
│  │              SQLAlchemy ORM + PostgreSQL                         ││
│  │  users │ products │ inventory_logs │ suppliers │ purchase_orders ││
│  │  purchase_order_items │ reports │ automation_logs               ││
│  └──────────────────────────────────────────────────────────────── ┘│
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   /ai/chat      │  │  /invoices   │  │  /products/{id}/       │ │
│  │                 │  │   /parse     │  │   forecast             │ │
│  │  LLM Provider   │  │              │  │                        │ │
│  │  ┌───────────┐  │  │  OCR Engine  │  │  Demand Forecasting    │ │
│  │  │Tool Calls │  │  │  Tesseract / │  │  Moving Average /      │ │
│  │  │  ↕        │  │  │  Vision LLM  │  │  Exp. Smoothing        │ │
│  │  │  DB Query │  │  │              │  │                        │ │
│  │  └───────────┘  │  └──────────────┘  └────────────────────────┘ │
│  └─────────────────┘                                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────── ┐│
│  │                   APScheduler (Runs on startup)                  ││
│  │  08:00 UTC → Daily Stock Alert + Auto Draft PO                  ││
│  │  07:00 Mon → Weekly Inventory Report                            ││
│  │  09:00 UTC → Daily Expiry Alert                                 ││
│  └──────────────────────────────────────────────────────────────── ┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI + Python 3.11 |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Auth | JWT (access + refresh) + bcrypt |
| AI | OpenAI / Anthropic / Gemini (tool calling) |
| OCR | Tesseract + pytesseract / Vision LLM |
| Scheduler | APScheduler (AsyncIO) |
| Containerization | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- An API key from OpenAI, Anthropic, or Google Gemini

### 1. Clone & Configure

```bash
git clone <repo>
cd smartstore-ai

# Create .env from template
cp .env.example .env

# Edit .env with your settings (especially AI keys)
nano .env
```

### 2. Start with Docker Compose

```bash
docker compose up --build
```

The API will be available at: **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

### 3. Local Development (without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up PostgreSQL locally, then update .env
alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Async PostgreSQL URL (`postgresql+asyncpg://...`) |
| `SYNC_DATABASE_URL` | ✅ | Sync URL for Alembic migrations |
| `SECRET_KEY` | ✅ | JWT signing secret (min 32 chars) |
| `AI_PROVIDER` | ✅ | `openai` \| `anthropic` \| `gemini` |
| `OPENAI_API_KEY` | ⚠️ | Required if `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | ⚠️ | Required if `AI_PROVIDER=anthropic` |
| `GEMINI_API_KEY` | ⚠️ | Required if `AI_PROVIDER=gemini` |
| `USE_VISION_LLM` | ❌ | Use OpenAI Vision for OCR (default: false = Tesseract) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | Default: 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ❌ | Default: 7 |

---

## 📋 API Reference

### Authentication

```
POST /auth/register   → Create account
POST /auth/login      → Get tokens
POST /auth/refresh    → Rotate refresh token
POST /auth/logout     → Revoke tokens
GET  /auth/me         → Current user info
```

### Products & Inventory

```
POST   /products/                          → Create product
GET    /products/?page=1&category=X        → List (paginated + filtered)
GET    /products/{id}                      → Get product detail
PATCH  /products/{id}                      → Update product
DELETE /products/{id}                      → Soft delete (admin only)
POST   /products/{id}/adjust-stock         → Adjust stock with log entry
GET    /products/{id}/inventory-logs       → Full change history
GET    /products/{id}/forecast?days=7      → Demand forecast
```

### Suppliers

```
POST   /suppliers/       → Create supplier (admin only)
GET    /suppliers/       → List all active suppliers
GET    /suppliers/{id}   → Supplier detail
PATCH  /suppliers/{id}   → Update (admin only)
DELETE /suppliers/{id}   → Soft delete (admin only)
```

### Purchase Orders

```
POST   /purchase-orders/                  → Create draft PO
GET    /purchase-orders/?status=draft     → List (filterable by status/supplier)
GET    /purchase-orders/{id}              → PO detail with items
PATCH  /purchase-orders/{id}/status       → Transition status
POST   /purchase-orders/{id}/send-email   → Send to supplier (admin only)
```

**Status Flow:**
```
draft → sent → acknowledged → received
  ↘         ↘              ↘
   cancelled  cancelled     cancelled
```

### AI Assistant

```
POST /ai/chat
Body: { "messages": [{ "role": "user", "content": "Which products are low on stock?" }] }
```

### Invoice OCR

```
POST /invoices/parse
Body: multipart/form-data with file (JPEG/PNG/PDF)
```

### Reports & Automation

```
GET /reports/                → List generated reports (admin)
GET /reports/automation-logs → View scheduler job history (admin)
```

---

## 🤖 AI Integration Deep Dive

The AI module uses **real function/tool calling** — not a chatbot with hardcoded responses.

### How It Works

```
User message
     │
     ▼
  LLM API (GPT-4o / Claude / Gemini)
     │
     │ Decides which tool to call
     ▼
  ToolExecutor.execute(tool_name, args)
     │
     │ Runs SQL query against PostgreSQL
     ▼
  JSON result returned to LLM
     │
     │ LLM synthesizes natural language response
     ▼
  Final answer (grounded in real data)
```

### Available Tools

| Tool | Description |
|------|-------------|
| `get_low_stock_products` | Fetches products below reorder threshold from DB |
| `get_product_detail` | Gets full product info by ID or SKU |
| `get_po_history` | Retrieves purchase orders (filterable) |
| `get_expiring_products` | Finds products expiring within N days |
| `create_draft_po` | Creates a real draft PO in the database |

### Example Queries

```
"What products are critically low on stock?"
"Show me the purchase order history for last month"
"Which items expire in the next 7 days?"
"Create a draft PO for supplier X with 50 units of Product Y"
"Give me full details on product SKU-12345"
```

**Key principle**: The LLM never makes up inventory data. Every fact comes from a live DB query.

---

## ⚙️ Automation Engine

Three scheduled jobs run automatically on server startup:

### Job 1: Daily Stock Alert (08:00 UTC)
- Queries all products below `reorder_threshold`
- Groups them and creates a draft PO automatically
- Logs results to `automation_logs` table

### Job 2: Weekly Report (Monday 07:00 UTC)
- Aggregates inventory metrics for the past 7 days
- Saves structured report to `reports` table
- Includes: active products, low stock count, PO values, expiry alerts

### Job 3: Daily Expiry Alert (09:00 UTC)
- Finds products expiring within 14 days
- Generates recommended actions per product
- Saves expiry report to `reports` table

All jobs log: `job_name`, `timestamp`, `status`, `details` — queryable via `/reports/automation-logs`.

---

## 📊 Demand Forecasting

```
GET /products/{id}/forecast?days=7
```

**Method selection logic:**
- `< 3` data points → Fallback (threshold-based estimate)
- `3–7` data points → **Simple Moving Average** (window=3)
- `> 7` data points → **Exponential Smoothing** (α=0.3)

All forecasts are based on real `InventoryLog` sales entries — no random data.

---

## 🧾 OCR Invoice Parsing

**Tesseract mode** (default):
- Uses pytesseract for text extraction
- Regex heuristics to extract: supplier, date, invoice#, line items, total
- Returns `parse_confidence`: high / medium / low

**Vision LLM mode** (`USE_VISION_LLM=true`):
- Sends image to GPT-4o Vision
- Returns structured JSON with higher accuracy
- Recommended for production

---

## 🔐 Security Model

- **JWT Access Token**: 30-minute expiry, signed with `SECRET_KEY`
- **Refresh Token**: 7-day expiry, stored hashed in DB; rotation on every use
- **bcrypt**: Password hashing with salt rounds
- **Role-based access**:
  - `admin`: Full access to all endpoints
  - `staff`: Cannot create/edit suppliers, cannot send POs

---

## 🗄️ Database Schema

```
users              → Authentication & roles
products           → Inventory catalog
inventory_logs     → Every stock movement tracked
suppliers          → Vendor registry
purchase_orders    → PO lifecycle management
purchase_order_items → PO line items
reports            → Generated automation reports
automation_logs    → Scheduler job execution history
```

---

## 📁 Project Structure

```
smartstore-ai/
├── docker-compose.yml
├── .env.example
└── backend/
    ├── Dockerfile
    ├── alembic.ini
    ├── requirements.txt
    ├── alembic/
    │   ├── env.py
    │   ├── script.py.mako
    │   └── versions/
    │       └── 0001_initial.py
    └── app/
        ├── main.py              ← FastAPI app, lifespan, middleware
        ├── core/
        │   ├── config.py        ← Pydantic Settings
        │   ├── security.py      ← JWT + bcrypt
        │   ├── exceptions.py    ← Custom HTTP exceptions
        │   └── logging.py       ← Structured logging
        ├── db/
        │   └── session.py       ← Async engine + session factory
        ├── models/              ← SQLAlchemy ORM models
        ├── schemas/             ← Pydantic v2 schemas
        ├── dependencies/
        │   └── auth.py          ← JWT guards / role checks
        ├── services/            ← All business logic (no logic in routers)
        │   ├── auth_service.py
        │   ├── product_service.py
        │   ├── supplier_service.py
        │   └── purchase_order_service.py
        ├── ai/
        │   ├── tools.py         ← Tool schemas for LLM function calling
        │   ├── tool_executor.py ← DB-grounded tool execution
        │   └── chat_service.py  ← Multi-provider AI with agentic loop
        ├── forecast/
        │   └── forecast_service.py  ← MA + Exp. Smoothing forecasting
        ├── ocr/
        │   └── ocr_service.py   ← Tesseract + Vision LLM fallback
        ├── automation/
        │   ├── jobs.py          ← Async scheduled jobs
        │   └── scheduler.py     ← APScheduler setup
        └── routers/             ← Thin route handlers (no business logic)
```

---

## 🧪 Testing the API

### 1. Register & Login

```bash
# Register admin
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","full_name":"Admin","password":"secret123","role":"admin"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}'
```

### 2. Create a Product

```bash
curl -X POST http://localhost:8000/products/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Coffee Beans",
    "sku": "COFFEE-001",
    "category": "Beverages",
    "stock": 5,
    "price": 24.99,
    "reorder_threshold": 20
  }'
```

### 3. Ask the AI

```bash
curl -X POST http://localhost:8000/ai/chat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Which products are running low on stock? Create a draft PO if needed."}
    ]
  }'
```

---

## 📜 License

MIT — Use freely, build boldly.