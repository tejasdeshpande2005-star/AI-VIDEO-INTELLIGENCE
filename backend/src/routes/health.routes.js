const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

router.get('/', (req, res) => {
  let dbStatus = false;
  try {
    const db = getDB();
    db.prepare('SELECT 1').get();
    dbStatus = true;
  } catch (e) {
    dbStatus = false;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStatus
  });
});

module.exports = router;
