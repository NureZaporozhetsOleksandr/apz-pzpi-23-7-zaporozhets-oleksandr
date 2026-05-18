const express = require('express');
const db = require('../../db/db');
const { logAction } = require('../auth');

const router = express.Router();

const DEVICE_KEY = process.env.IOT_DEVICE_KEY || 'worktime-iot-key';

function checkDeviceKey(req, res, next) {
    const deviceKey = req.headers['x-device-key'];

    if (!deviceKey || deviceKey !== DEVICE_KEY) {
        return res.status(403).json({
            message: 'Invalid IoT device key'
        });
    }

    next();
}

function mapIotType(type) {
    const map = {
        START_WORK: 'StartWork',
        END_WORK: 'EndWork',
        BREAK_START: 'BreakStart',
        BREAK_END: 'BreakEnd',

        StartWork: 'StartWork',
        EndWork: 'EndWork',
        BreakStart: 'BreakStart',
        BreakEnd: 'BreakEnd'
    };

    return map[type] || null;
}

router.post('/events', checkDeviceKey, (req, res) => {
    const {
        deviceId,
        userId,
        type,
        state,
        workedMinutes,
        breakMinutes,
        tsMs
    } = req.body;

    if (!userId) {
        return res.status(400).json({
            message: 'Missing userId'
        });
    }

    if (!type) {
        return res.status(400).json({
            message: 'Missing type'
        });
    }

    const entryType = mapIotType(type);

    if (!entryType) {
        return res.status(400).json({
            message: 'Invalid event type'
        });
    }

    const timestamp = new Date().toISOString();

    const comment = JSON.stringify({
        source: 'iot',
        deviceId: deviceId || null,
        state: state || null,
        workedMinutes: workedMinutes ?? null,
        breakMinutes: breakMinutes ?? null,
        tsMs: tsMs ?? null
    });

    const sql = `
        INSERT INTO TimeEntries (UserId, EntryType, StartTime, EndTime, Comment)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(sql, [userId, entryType, timestamp, null, comment], function (err) {
        if (err) {
            console.error('IOT insert error:', err.message);

            return res.status(500).json({
                message: 'DB error',
                details: err.message
            });
        }

        try {
            logAction(
                Number(userId),
                'IOT_EVENT',
                'TimeEntries',
                this.lastID,
                null,
                JSON.stringify({
                    deviceId,
                    userId,
                    type,
                    entryType
                })
            );
        } catch (e) {
            console.error('IOT audit log error:', e.message);
        }

        return res.status(201).json({
            id: this.lastID,
            userId: Number(userId),
            deviceId,
            entryType,
            timestamp,
            message: 'IoT event saved'
        });
    });
});

router.get('/events', checkDeviceKey, (req, res) => {
    const limit = Number(req.query.limit || 20);

    const sql = `
        SELECT Id, UserId, EntryType, StartTime, EndTime, Comment
        FROM TimeEntries
        WHERE Comment LIKE '%"source":"iot"%'
           OR Comment LIKE '%device:%'
        ORDER BY Id DESC
        LIMIT ?
    `;

    db.all(sql, [limit], (err, rows) => {
        if (err) {
            console.error('IOT select error:', err.message);

            return res.status(500).json({
                message: 'DB error',
                details: err.message
            });
        }

        return res.json(rows);
    });
});

module.exports = router;