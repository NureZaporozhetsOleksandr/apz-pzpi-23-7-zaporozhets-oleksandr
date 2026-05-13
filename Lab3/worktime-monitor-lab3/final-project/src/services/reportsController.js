const express = require('express');
const db = require('../../db/db');
const { calculateSummary } = require('./reportService');
const { adminMiddleware } = require('../auth');

const router = express.Router();

const toDateOnly = (value) => {
  if (!value) return null;
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

function buildSummaryForUser(userId, from, to, cb) {
  const scheduleSql = `
    SELECT * FROM WorkSchedules
    WHERE UserId = ? OR UserId IS NULL
    ORDER BY CASE WHEN UserId IS NULL THEN 1 ELSE 0 END
    LIMIT 1
  `;
  db.get(scheduleSql, [userId], (schErr, scheduleRow) => {
    if (schErr) return cb(schErr);
    const entriesSql = `
      SELECT * FROM TimeEntries
      WHERE UserId = ? AND date(StartTime) >= date(?) AND date(StartTime) <= date(?)
      ORDER BY StartTime ASC
    `;
    db.all(entriesSql, [userId, from, to], (teErr, entries) => {
      if (teErr) return cb(teErr);
      const absencesSql = `
        SELECT * FROM AbsenceRecords
        WHERE UserId = ? AND date(DateEnd) >= date(?) AND date(DateStart) <= date(?)
        ORDER BY DateStart ASC
      `;
      db.all(absencesSql, [userId, from, to], (abErr, absences) => {
        if (abErr) return cb(abErr);
        const summary = calculateSummary(from, to, entries || [], scheduleRow || null, absences || []);
        cb(null, { userId, from, to, days: summary.days, totals: summary.totals });
      });
    });
  });
}

router.get('/my/summary', (req, res) => {
  const from = toDateOnly(req.query.from);
  const to = toDateOnly(req.query.to);
  if (!from || !to) return res.status(400).json({ message: 'Invalid from/to' });
  buildSummaryForUser(req.user.id, from, to, (err, summary) => {
    if (err) return res.status(500).json({ message: 'DB error (summary)' });
    res.json(summary);
  });
});

router.get('/users/:userId/summary', adminMiddleware, (req, res) => {
  const from = toDateOnly(req.query.from);
  const to = toDateOnly(req.query.to);
  const userId = parseInt(req.params.userId, 10);
  if (!from || !to || !userId) return res.status(400).json({ message: 'Invalid params' });
  buildSummaryForUser(userId, from, to, (err, summary) => {
    if (err) return res.status(500).json({ message: 'DB error (user summary)' });
    res.json(summary);
  });
});

router.get('/summary', adminMiddleware, (req, res) => {
  const from = toDateOnly(req.query.from);
  const to = toDateOnly(req.query.to);
  if (!from || !to) return res.status(400).json({ message: 'Invalid from/to' });
  db.all('SELECT Id, FullName, Login, Role, IsActive FROM Users ORDER BY FullName', [], (err, users) => {
    if (err) return res.status(500).json({ message: 'DB error (users)' });
    const result = [];
    let index = 0;
    function next() {
      if (index >= users.length) {
        const totals = result.reduce((acc, item) => {
          const t = item.summary.totals;
          acc.totalPlannedMinutes += t.totalPlannedMinutes || 0;
          acc.totalWorkedMinutes += t.totalWorkedMinutes || 0;
          acc.totalOvertimeMinutes += t.totalOvertimeMinutes || 0;
          acc.totalUndertimeMinutes += t.totalUndertimeMinutes || 0;
          acc.totalLateMinutes += t.totalLateMinutes || 0;
          acc.lateDaysCount += t.lateDaysCount || 0;
          acc.daysWithAbsence += t.daysWithAbsence || 0;
          return acc;
        }, { totalPlannedMinutes: 0, totalWorkedMinutes: 0, totalOvertimeMinutes: 0, totalUndertimeMinutes: 0, totalLateMinutes: 0, lateDaysCount: 0, daysWithAbsence: 0 });
        return res.json({ from, to, totals, users: result });
      }
      const user = users[index++];
      buildSummaryForUser(user.Id, from, to, (sumErr, summary) => {
        if (!sumErr) result.push({ user, summary });
        next();
      });
    }
    next();
  });
});

module.exports = router;
