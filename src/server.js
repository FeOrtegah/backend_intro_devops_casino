// ============================================================
// API REST del Casino Online - Experiencia 2 (DevOps)
// ============================================================
const express = require('express');
const cors = require('cors');
const { pool, esperarBD } = require('./db/pool');
const { sembrarUsuariosDemo } = require('./db/seed');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// CORS configurable: lista separada por coma o "*"
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim())
}));
app.use(express.json({ limit: '1mb' }));

// Healthcheck (lo usa Docker / GitHub Actions / EC2)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up', uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'down', error: err.message });
  }
});

// Bienvenida
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Casino Online',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/usuarios/me', '/api/juegos', '/api/transacciones']
  });
});

// Rutas
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/usuarios',      require('./routes/users'));
app.use('/api/juegos',        require('./routes/games'));
app.use('/api/transacciones', require('./routes/transactions'));

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('[ERR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

(async () => {
  await esperarBD();
  await sembrarUsuariosDemo();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] Casino escuchando en http://0.0.0.0:${PORT}`);
  });
})();
