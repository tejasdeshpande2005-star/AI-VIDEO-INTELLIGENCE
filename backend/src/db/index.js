const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const logger = require('../utils/logger');

let db;
let dbPath;

// Wrapper to provide a better-sqlite3-like API over sql.js
class DBWrapper {
  constructor(sqlJsDb, filePath) {
    this._db = sqlJsDb;
    this._filePath = filePath;
    this._saveTimer = null;
  }

  exec(sql) {
    this._db.run(sql);
    this._scheduleSave();
  }

  prepare(sql) {
    const self = this;
    return {
      run(params) {
        const stmt = self._db.prepare(sql);
        if (params && typeof params === 'object' && !Array.isArray(params)) {
          // Named parameters: convert @key to $key for sql.js
          const sqlJsParams = {};
          for (const [key, value] of Object.entries(params)) {
            sqlJsParams[`:${key}`] = value;
          }
          stmt.bind(sqlJsParams);
        } else if (Array.isArray(params)) {
          stmt.bind(params);
        } else if (params !== undefined) {
          stmt.bind([params]);
        }
        stmt.step();
        stmt.free();
        self._scheduleSave();
        return { changes: self._db.getRowsModified() };
      },
      get(...args) {
        const stmt = self._db.prepare(sql);
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
          const sqlJsParams = {};
          for (const [key, value] of Object.entries(args[0])) {
            sqlJsParams[`:${key}`] = value;
          }
          stmt.bind(sqlJsParams);
        } else if (args.length === 1) {
          stmt.bind([args[0]]);
        } else if (args.length > 1) {
          stmt.bind(args);
        }
        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const row = {};
          columns.forEach((col, idx) => { row[col] = values[idx]; });
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...args) {
        const stmt = self._db.prepare(sql);
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
          const sqlJsParams = {};
          for (const [key, value] of Object.entries(args[0])) {
            sqlJsParams[`:${key}`] = value;
          }
          stmt.bind(sqlJsParams);
        } else if (args.length === 1) {
          stmt.bind([args[0]]);
        } else if (args.length > 1) {
          stmt.bind(args);
        }
        const rows = [];
        const columns = stmt.getColumnNames();
        while (stmt.step()) {
          const values = stmt.get();
          const row = {};
          columns.forEach((col, idx) => { row[col] = values[idx]; });
          rows.push(row);
        }
        stmt.free();
        return rows;
      }
    };
  }

  pragma(pragmaStr) {
    this._db.run(`PRAGMA ${pragmaStr}`);
  }

  close() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
    }
    this._save();
    this._db.close();
  }

  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._save();
      this._saveTimer = null;
    }, 100);
  }

  _save() {
    if (!this._filePath) return;
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this._filePath, buffer);
    } catch (e) {
      logger.error('Failed to save database', { error: e.message });
    }
  }
}

async function initDB() {
  dbPath = path.resolve(config.dbPath);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing DB file if it exists
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    const sqlDb = new SQL.Database(fileBuffer);
    db = new DBWrapper(sqlDb, dbPath);
  } else {
    const sqlDb = new SQL.Database();
    db = new DBWrapper(sqlDb, dbPath);
  }

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      incident_id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      behaviour TEXT NOT NULL,
      track_id INTEGER NOT NULL,
      frame_start INTEGER NOT NULL,
      frame_end INTEGER NOT NULL,
      timestamp_start_sec REAL NOT NULL,
      timestamp_end_sec REAL NOT NULL,
      risk_level TEXT NOT NULL,
      confidence REAL,
      evidence TEXT,
      reviewed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      video_id TEXT PRIMARY KEY,
      filename TEXT,
      jsonl_path TEXT,
      video_path TEXT,
      frame_count INTEGER,
      duration_sec REAL,
      ingested_at TEXT DEFAULT (datetime('now')),
      incident_count INTEGER DEFAULT 0
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_incidents_video_id ON incidents(video_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_incidents_behaviour ON incidents(behaviour)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_incidents_risk_level ON incidents(risk_level)`);

  logger.info('Database initialized');
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return db;
}

module.exports = { initDB, getDB };
