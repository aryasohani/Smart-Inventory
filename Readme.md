# 🏪 Smart Inventory — AI-Powered Inventory & Vendor Management

A full-stack inventory management system with a **FastAPI backend** and **React frontend**, featuring real AI tool-calling, automated scheduling, OCR invoice parsing, and demand forecasting.

---

## 🗂️ Project Structure

```
Smart-Inventory/
├── backend/                        ← FastAPI + Python backend
│   ├── app/
│   │   ├── ai/                     ← AI chat with tool calling
│   │   ├── automation/             ← APScheduler jobs
│   │   ├── core/                   ← Config, security, logging
│   │   ├── db/                     ← Async SQLAlchemy session
│   │   ├── dependencies/           ← JWT auth guards
│   │   ├── forecast/               ← Demand forecasting
│   │   ├── models/                 ← ORM models
│   │   ├── ocr/                    ← Invoice OCR parsing
│   │   ├── repositories/           ← DB query layer
│   │   ├── routers/                ← API route handlers
│   │   ├── schemas/                ← Pydantic v2 schemas
│   │   ├── services/               ← Business logic
│   │   └── main.py                 ← FastAPI app entry point
│   ├── alembic/                    ← DB migrations
│   ├── .env.example                ← Environment variable template
│   ├── requirements.txt
│   └── alembic.ini
│
└── smartstore-ai-studio-main/      ← React + TypeScript frontend
    ├── src/
    │   ├── app/
    │   │   ├── pages/              ← Dashboard, Products, Suppliers, POs, etc.
    │   │   ├── features/ai/        ← AI Chat Dock
    │   │   ├── layouts/            ← Sidebar, Topbar, AppLayout
    │   │   └── auth/               ← Protected routes
    │   ├── api/                    ← Axios API calls
    │   ├── hooks/                  ← Custom React hooks
    │   └── lib/                    ← Utilities
    ├── .env.example
    └── package.json
```

---

## 🧱 Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | FastAPI + Python 3.11 |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (Neon) |
| Migrations | Alembic |
| Auth | JWT (access + refresh) + bcrypt |
| AI | OpenAI / Anthropic / Gemini (tool calling) |
| OCR | Tesseract + pytesseract / Vision LLM |
| Scheduler | APScheduler (AsyncIO) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Routing | TanStack Router |
| State/Data | TanStack Query (React Query) |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Build Tool | Vite |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ or Bun
- PostgreSQL database (Neon recommended)
- API key from OpenAI, Anthropic, or Google Gemini
- Tesseract OCR (for invoice parsing)

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your actual values

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API available at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd smartstore-ai-studio-main

# Install dependencies
npm install
# or
bun install

# Setup environment variables
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL to your backend URL

# Start dev server
npm run dev
# or
bun dev
```

Frontend available at: `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Async PostgreSQL URL (`postgresql+asyncpg://...`) |
| `SYNC_DATABASE_URL` | ✅ | Sync URL for Alembic migrations |
| `SECRET_KEY` | ✅ | JWT signing secret (min 32 chars) |
| `AI_PROVIDER` | ✅ | `openai` \| `anthropic` \| `gemini` |
| `OPENAI_API_KEY` | ⚠️ | Required if `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | ⚠️ | Required if `AI_PROVIDER=anthropic` |
| `GEMINI_API_KEY` | ⚠️ | Required if `AI_PROVIDER=gemini` |
| `TESSERACT_CMD` | ❌ | Path to Tesseract executable |
| `USE_VISION_LLM` | ❌ | Use Vision LLM for OCR (default: `false`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | Default: `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ❌ | Default: `7` |

### Frontend (`smartstore-ai-studio-main/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL (e.g., `http://localhost:8000`) |

---

## 📋 Pages (Frontend)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | JWT authentication |
| Signup | `/signup` | New user registration |
| Dashboard | `/` | Overview & stats |
| Products | `/products` | Inventory catalog |
| Product Detail | `/products/:id` | Stock, logs, forecast |
| Suppliers | `/suppliers` | Vendor management |
| Purchase Orders | `/purchase-orders` | PO lifecycle |
| Invoice OCR | `/invoices` | Parse invoices via OCR |
| Reports | `/reports` | Generated reports |
| Automation | `/automation` | Scheduler job logs |
| AI Chat | (floating dock) | AI assistant |

---

## 📋 API Reference

### Authentication
```
POST /auth/register    → Create account
POST /auth/login       → Get tokens
POST /auth/refresh     → Rotate refresh token
POST /auth/logout      → Revoke tokens
GET  /auth/me          → Current user info
```

### Products & Inventory
```
POST   /products/                      → Create product
GET    /products/?page=1&category=X   → List (paginated + filtered)
GET    /products/{id}                  → Product detail
PATCH  /products/{id}                  → Update product
DELETE /products/{id}                  → Soft delete (admin only)
POST   /products/{id}/adjust-stock     → Adjust stock
GET    /products/{id}/inventory-logs   → Stock change history
GET    /products/{id}/forecast?days=7  → Demand forecast
```

### Suppliers
```
POST   /suppliers/      → Create supplier (admin only)
GET    /suppliers/      → List all suppliers
GET    /suppliers/{id}  → Supplier detail
PATCH  /suppliers/{id}  → Update (admin only)
DELETE /suppliers/{id}  → Soft delete (admin only)
```

### Purchase Orders
```
POST   /purchase-orders/               → Create draft PO
GET    /purchase-orders/?status=draft  → List POs
GET    /purchase-orders/{id}           → PO detail with items
PATCH  /purchase-orders/{id}/status    → Transition status
POST   /purchase-orders/{id}/send-email → Send to supplier
```

**Status Flow:** `draft → sent → acknowledged → received` (or `cancelled`)

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
GET /reports/automation-logs → Scheduler job history (admin)
```

---

## 🤖 AI Integration

The AI module uses real **function/tool calling** — not a chatbot with hardcoded responses. Every answer is grounded in live database queries.

### Available AI Tools

| Tool | Description |
|------|-------------|
| `get_low_stock_products` | Fetches products below reorder threshold |
| `get_product_detail` | Gets full product info by ID or SKU |
| `get_po_history` | Retrieves purchase orders (filterable) |
| `get_expiring_products` | Finds products expiring within N days |
| `create_draft_po` | Creates a real draft PO in the database |

### Example Queries
- *"What products are critically low on stock?"*
- *"Show me PO history for last month"*
- *"Which items expire in the next 7 days?"*
- *"Create a draft PO for supplier X with 50 units of Product Y"*

---

## ⚙️ Automation (Scheduled Jobs)

Three jobs run automatically on server startup:

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Stock Alert | 08:00 UTC daily | Checks low stock, auto-creates draft POs |
| Weekly Report | Monday 07:00 UTC | Aggregates inventory metrics |
| Daily Expiry Alert | 09:00 UTC daily | Finds products expiring within 14 days |

All jobs are logged to the `automation_logs` table, queryable at `/reports/automation-logs`.

---

## 📊 Demand Forecasting

`GET /products/{id}/forecast?days=7`

| Data Points | Method |
|-------------|--------|
| < 3 | Fallback (threshold-based estimate) |
| 3–7 | Simple Moving Average (window=3) |
| > 7 | Exponential Smoothing (α=0.3) |

---

## 🧾 OCR Invoice Parsing

- **Tesseract mode** (default) — local OCR with regex heuristics
- **Vision LLM mode** (`USE_VISION_LLM=true`) — GPT-4o Vision for higher accuracy

Returns: supplier, date, invoice number, line items, total, and `parse_confidence`.

---

## 🔐 Security

- JWT Access Token: 30-minute expiry
- Refresh Token: 7-day expiry, stored hashed, rotated on every use
- bcrypt password hashing
- Role-based access: `admin` (full access) | `staff` (limited access)

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | Authentication & roles |
| `products` | Inventory catalog |
| `inventory_logs` | Every stock movement |
| `suppliers` | Vendor registry |
| `purchase_orders` | PO lifecycle |
| `purchase_order_items` | PO line items |
| `reports` | Generated automation reports |
| `automation_logs` | Scheduler job history |