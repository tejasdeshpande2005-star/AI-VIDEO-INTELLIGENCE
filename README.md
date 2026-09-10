# Warehouse Behaviour Intelligence — Backend + Frontend

Ingests the CV module's JSONL event logs, classifies 10 warehouse behaviour types with risk levels, persists incidents to SQLite, and serves a React dashboard with video player, timeline, heatmap, and LLM chat assistant.

## Architecture

```
cv-module/data/processed_events/*.jsonl    cv-module/data/demo_output/*.mp4
              │                                        │
              ▼                                        │
  ┌─── Ingestion Service ───┐                          │
  │  (streaming JSONL parse) │                          │
  └──────────┬──────────────┘                          │
             ▼                                         │
  ┌─── Track Buffer ────────┐                          │
  │  (per-track time series) │                          │
  └──────────┬──────────────┘                          │
             ▼                                         │
  ┌─── Risk Rule Engine ────┐                          │
  │  (10 behaviour rules)    │                          │
  └──────────┬──────────────┘                          │
             ▼                                         │
  ┌─── Score Calculator ────┐                          │
  │  (merge, escalate risk)  │                          │
  └──────────┬──────────────┘                          │
             ▼                                         ▼
  ┌─── SQLite + REST API ───┐     ┌── Static Video Server ──┐
  │  + WebSocket (Socket.IO) │◄────│  (annotated mp4s)       │
  └──────────┬──────────────┘     └─────────────────────────┘
             │
  ┌─── LLM Assistant ──────┐     ┌── React Dashboard ──────┐
  │  (Anthropic, grounded)   │◄────│  (video+timeline+chat)  │
  └─────────────────────────┘     └─────────────────────────┘
```

## Prerequisites

- **Node.js 20+**
- **npm** (comes with Node.js)
- **(Optional)** Anthropic API key for the LLM assistant

## Quick Start

### 1. Clone and set up the CV module submodule

```bash
git submodule add https://github.com/Lost-glitched/Warehouse-Behaviour-Intelligence.git cv-module
git submodule update --init
```

### 2. Install & start the backend

```bash
cd backend
cp .env.example .env
# Edit .env to set ANTHROPIC_API_KEY if you want the LLM assistant
npm install
npm run dev
```

The backend starts on **http://localhost:3001**.

### 3. Install & start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173** (proxies API calls to `:3001`).

### 4. Ingest data

Either trigger from the dashboard ("Run Analysis" button) or via API:

```bash
# Ingest all JSONL files in cv-module/data/processed_events/
curl -X POST http://localhost:3001/api/ingest/all

# Ingest a specific video
curl -X POST http://localhost:3001/api/ingest/bay1_clip03
```

### 5. Point at a different events folder

Edit `backend/.env`:

```
CV_EVENTS_PATH=../cv-module/data/processed_events
CV_VIDEO_PATH=../cv-module/data/demo_output
```

Or set environment variables directly:

```bash
CV_EVENTS_PATH=/path/to/your/jsonl/files npm run dev
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/ingest/all` | Ingest all JSONL files |
| `POST` | `/api/ingest/:videoId` | Ingest a specific video |
| `GET` | `/api/incidents` | List incidents (filterable) |
| `GET` | `/api/incidents/:id` | Get incident detail |
| `PATCH` | `/api/incidents/:id/review` | Mark incident as reviewed |
| `GET` | `/api/events?video_id=X` | Raw frame events (debug) |
| `GET` | `/api/videos` | List ingested videos |
| `GET` | `/api/videos/:videoId` | Video metadata |
| `POST` | `/api/assistant/query` | LLM assistant query |
| `GET` | `/videos/:filename` | Static annotated video files |

### Incident Filters

`GET /api/incidents` supports query parameters:

- `video_id` — filter by video
- `risk` — `Low`, `Medium`, `High`, or `Critical`
- `behaviour` — e.g. `dropped`, `dragging`, `roughHandling`
- `from` / `to` — timestamp range (seconds)
- `limit` / `offset` — pagination (defaults: 100/0)

### LLM Assistant

```bash
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the most critical incidents today?", "video_id": "bay1_clip03"}'
```

Response:
```json
{
  "answer": "Based on the incident data...",
  "cited_incident_ids": ["inc_a1b2c3d4"],
  "incident_count": 5
}
```

### WebSocket (Socket.IO)

Connect to the server on port 3001. Listen for `new_incident` events to receive real-time High/Critical incident alerts:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001');
socket.on('new_incident', (incident) => {
  console.log('New alert:', incident);
});
```

## 10 Detected Behaviours

| # | Behaviour | Key Signal | Default Risk |
|---|-----------|-----------|-------------|
| 1 | Product dropped | Vertical velocity spike → sudden stop | High |
| 2 | Dragging instead of lifting | Sustained horizontal velocity, no lift | Medium |
| 3 | Improper stacking | Size ratio out of range on stacked pair | Medium–High |
| 4 | Unstable stacking | Oscillating position/aspect ratio | High |
| 5 | Rough handling / throwing | Peak velocity > 90 px/s | High–Critical |
| 6 | Outside designated area | `in_zone` null or unrecognized | Medium |
| 7 | Stepping on cartons | Person foot overlapping box track | High |
| 8 | Wrong orientation | Aspect ratio outside expected range | Low–Medium |
| 9 | Pallet overhang | Box bbox extends beyond pallet | Medium |
| 10 | Wrong equipment | Dragging without trolley nearby | Medium |

All thresholds are configurable in `backend/src/config/riskThresholds.js`.

## Testing

```bash
cd backend
npm test
```

Tests include:
- **Unit tests** for each rule module with synthetic track series
- **Integration tests** for the full ingestion → incident pipeline
- **API tests** for REST endpoint correctness

## Project Structure

```
backend/
├── src/
│   ├── server.js              # HTTP + Socket.IO startup
│   ├── app.js                 # Express app setup
│   ├── config/                # env.js, riskThresholds.js
│   ├── controllers/           # Route handlers
│   ├── db/                    # SQLite setup (better-sqlite3)
│   ├── middleware/             # Error handler, validation
│   ├── models/                # Incident, Video, Zod schemas
│   ├── routes/                # Express routers
│   ├── services/
│   │   ├── cvIngestService.js       # JSONL file reader
│   │   ├── trackBufferService.js    # Per-track time series
│   │   ├── riskEngine/
│   │   │   ├── index.js             # Orchestrator
│   │   │   ├── scoreCalculator.js   # Merge & escalate
│   │   │   └── rules/              # 10 rule modules
│   │   ├── llmService.js           # Anthropic SDK
│   │   └── alertService.js         # Socket.IO emitter
│   ├── sockets/               # Socket.IO setup
│   └── utils/                 # Logger (winston)
├── tests/
│   ├── fixtures/              # Synthetic JSONL files
│   ├── riskEngine.test.js
│   ├── incidents.test.js
│   └── api.test.js
└── package.json

frontend/
├── src/
│   ├── App.jsx                # Router + layout
│   ├── api/                   # Axios API clients
│   ├── components/            # VideoPlayer, Timeline, Heatmap, Chat
│   ├── hooks/                 # useIncidents, useSocket
│   └── pages/                 # Dashboard, IncidentDetail
├── index.html
└── package.json
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `CV_EVENTS_PATH` | `../cv-module/data/processed_events` | Path to JSONL event files |
| `CV_VIDEO_PATH` | `../cv-module/data/demo_output` | Path to annotated video files |
| `ANTHROPIC_API_KEY` | *(required for LLM)* | Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Anthropic model to use |
| `DB_PATH` | `./data/warehouse.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Winston log level |

## Input Contract

This module consumes JSONL files produced by the CV module. Each line is one frame:

```json
{
  "schema_version": "1.0",
  "video_id": "bay1_clip03",
  "frame": 452,
  "timestamp_sec": 15.07,
  "objects": [
    {
      "track_id": 7,
      "class": "box",
      "bbox_xyxy": [340, 210, 420, 300],
      "velocity_px_s": [-2.1, 14.8],
      "in_zone": "loading_bay_1",
      "stacked_on_track_id": 12,
      "relative_size_vs_stacked": 1.4
    }
  ]
}
```

Required fields per object: `track_id`, `class`, `bbox_xyxy`. All others are optional.

## Incident Output Schema

```json
{
  "incident_id": "inc_a1b2c3d4",
  "video_id": "bay1_clip03",
  "behaviour": "dragging",
  "track_id": 12,
  "frame_start": 340,
  "frame_end": 410,
  "timestamp_start_sec": 11.3,
  "timestamp_end_sec": 13.7,
  "risk_level": "High",
  "confidence": 0.82,
  "evidence": { "trigger_rule": "dragging.js", "..." : "..." },
  "reviewed": false
}
```
