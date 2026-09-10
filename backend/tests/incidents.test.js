const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'data', 'test_warehouse.db');

const fs = require('fs');
const { initDB, getDB } = require('../src/db/index');
const cvIngestService = require('../src/services/cvIngestService');
const Incident = require('../src/models/Incident');

describe('Integration Tests: Incidents Pipeline', () => {
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

  it('should ingest test_dropped.jsonl and produce at least 1 dropped incident', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'test_dropped.jsonl');
    const result = await cvIngestService.ingestFile(fixturePath, 'test_dropped');
    expect(result.incidentsFound).toBeGreaterThanOrEqual(1);

    const incidents = Incident.findAll({ video_id: 'test_dropped' });
    const droppedIncidents = incidents.filter(i => i.behaviour.includes('dropped'));
    expect(droppedIncidents.length).toBeGreaterThanOrEqual(1);
  });

  it('should ingest test_dragging.jsonl and produce at least 1 dragging incident', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'test_dragging.jsonl');
    const result = await cvIngestService.ingestFile(fixturePath, 'test_dragging');
    expect(result.incidentsFound).toBeGreaterThanOrEqual(1);

    const incidents = Incident.findAll({ video_id: 'test_dragging' });
    const draggingIncidents = incidents.filter(i => i.behaviour.includes('dragging'));
    expect(draggingIncidents.length).toBeGreaterThanOrEqual(1);
  });

  it('should retrieve all incidents using Incident.findAll()', () => {
    const incidents = Incident.findAll();
    expect(incidents.length).toBeGreaterThan(0);
  });

  it('should retrieve correct incident using Incident.findById()', () => {
    const incidents = Incident.findAll();
    const firstIncident = incidents[0];
    const found = Incident.findById(firstIncident.incident_id);
    expect(found.incident_id).toBe(firstIncident.incident_id);
    expect(found.behaviour).toBe(firstIncident.behaviour);
  });

  it('should correctly filter incidents with Incident.findAll({ video_id })', () => {
    const incidents = Incident.findAll({ video_id: 'test_dropped' });
    expect(incidents.length).toBeGreaterThan(0);
    incidents.forEach(inc => {
      expect(inc.video_id).toBe('test_dropped');
    });
  });
});
