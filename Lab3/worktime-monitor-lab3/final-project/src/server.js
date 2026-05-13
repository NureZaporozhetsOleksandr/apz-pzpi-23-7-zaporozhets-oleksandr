const cors = require('cors')
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerDocument = require('./swagger');
const { authMiddleware, adminMiddleware } = require('./auth');

const adminRouter = require('./controllers/adminController');
const authRouter = require('./controllers/authController');
const usersRouter = require('./controllers/usersController');
const timeEntriesRouter = require('./controllers/timeEntriesController');
const absencesRouter = require('./controllers/absencesController');
const schedulesRouter = require('./controllers/schedulesController');
const reportsRouter = require('./services/reportsController');
const auditRouter = require('./controllers/auditController');

const app = express();
app.use(cors());
app.use(express.json());

// Статична роздача frontend. Це дозволяє запускати web-клієнт через backend
// і не використовувати Live Server, який перезавантажував сторінку після змін SQLite-БД.
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use('/app', express.static(frontendPath));

// Простий кореневий маршрут, щоб не було "Cannot GET /"
app.get('/', (req, res) => {
  res.send('API сервер працює. Відкрийте /swagger для документації або /app для web-клієнта.');
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Адміністрування (тільки для Admin)
app.use('/api/admin', authMiddleware, adminMiddleware, adminRouter);

// Автентифікація
app.use('/api/auth', authRouter);

// Користувачі (керування користувачами – тільки Admin)
app.use('/api/users', authMiddleware, adminMiddleware, usersRouter);

// Відмітки часу
app.use('/api/time-entries', authMiddleware, timeEntriesRouter);

// Відсутності
app.use('/api/absences', authMiddleware, absencesRouter);

// Робочі графіки
app.use('/api/schedules', authMiddleware, schedulesRouter);

// Звіти (використовують бізнес-логіку reportService)
app.use('/api/reports', authMiddleware, reportsRouter);

// Журнал аудиту (тільки Admin)
app.use('/api/audit', authMiddleware, adminMiddleware, auditRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API сервер запущено на http://localhost:${PORT}`);
  console.log(`Web-клієнт доступний на http://localhost:${PORT}/app`);
});
