const express = require('express');
const db = require('../../db/db');
const { logAction, adminMiddleware } = require('../auth');

const router = express.Router();

router.get('/all', adminMiddleware, (req, res) => {
  const sql = `
    SELECT a.*, u.FullName, u.Login
    FROM AbsenceRecords a
    LEFT JOIN Users u ON u.Id = a.UserId
    ORDER BY a.DateStart DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { type, dateStart, dateEnd, comment } = req.body;
  if (!type || !dateStart || !dateEnd) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const sql = `
    INSERT INTO AbsenceRecords (UserId, Type, DateStart, DateEnd, Comment)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [req.user.id, type, dateStart, dateEnd, comment || null], function (err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    const id = this.lastID;
    logAction(req.user.id, 'CREATE_ABSENCE', 'AbsenceRecords', id, null, JSON.stringify({ type, dateStart, dateEnd }));
    res.status(201).json({ id, userId: req.user.id, type, dateStart, dateEnd, comment: comment || null });
  });
});

router.get('/my', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM AbsenceRecords WHERE UserId = ?';
  const params = [req.user.id];
  if (from) { sql += ' AND DateStart >= ?'; params.push(from); }
  if (to) { sql += ' AND DateEnd <= ?'; params.push(to); }
  sql += ' ORDER BY DateStart ASC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { type, dateStart, dateEnd, comment } = req.body;
  db.get('SELECT * FROM AbsenceRecords WHERE Id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!row) return res.status(404).json({ message: 'Absence not found' });
    if (req.user.role !== 'Admin' && row.UserId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const oldValue = JSON.stringify(row);
    const newType = type || row.Type;
    const newDateStart = dateStart || row.DateStart;
    const newDateEnd = dateEnd || row.DateEnd;
    const newComment = comment !== undefined ? comment : row.Comment;
    db.run('UPDATE AbsenceRecords SET Type = ?, DateStart = ?, DateEnd = ?, Comment = ? WHERE Id = ?', [newType, newDateStart, newDateEnd, newComment, id], (err2) => {
      if (err2) return res.status(500).json({ message: 'DB error' });
      logAction(req.user.id, 'UPDATE_ABSENCE', 'AbsenceRecords', id, oldValue, JSON.stringify({ type: newType, dateStart: newDateStart, dateEnd: newDateEnd, comment: newComment }));
      res.json({ id, type: newType, dateStart: newDateStart, dateEnd: newDateEnd, comment: newComment });
    });
  });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.get('SELECT * FROM AbsenceRecords WHERE Id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!row) return res.status(404).json({ message: 'Absence not found' });
    if (req.user.role !== 'Admin' && row.UserId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    db.run('DELETE FROM AbsenceRecords WHERE Id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ message: 'DB error' });
      logAction(req.user.id, 'DELETE_ABSENCE', 'AbsenceRecords', id, JSON.stringify(row), null);
      res.json({ message: 'Absence deleted', id });
    });
  });
});

module.exports = router;
