const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'data', 'test_api.db');
process.env.CV_EVENTS_PATH = path.join(__dirname, 'fixtures');

const fs = require('fs');
const request = require('supertest');
const { initDB, getDB } = require('../src/db/index');
const app = require('../src/app');

describe('API Endpoints Tests', () => {
  beforeAll(async () => {
    const dbDir = path.dirname(process.env.DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    await initDB();
  });

  afterAll(() => {
    const db = getDB();
    if (db) db.close();
    if (fs.existsSync(process.env.DB_PATH)) {
      fs.unlinkSync(process.env.DB_PATH);
    }
  });

  it('GET /api/health should return 200 with status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('POST /api/ingest/test_dropped should return 200 after ingesting', async () => {
    const response = await request(app).post('/api/ingest/test_dropped');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.result.videoId).toBe('test_dropped');
    expect(response.body.result.incidentsFound).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/incidents should return 200 and an array of incidents', async () => {
    const response = await request(app).get('/api/incidents');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('GET /api/incidents?video_id=test_dropped should return filtered results', async () => {
    const response = await request(app).get('/api/incidents?video_id=test_dropped');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach(inc => {
      expect(inc.video_id).toBe('test_dropped');
    });
  });

  it('GET /api/incidents/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/incidents/nonexistent');
    expect(response.status).toBe(404);
  });
});
