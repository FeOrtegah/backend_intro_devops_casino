// ============================================================
// pool.js - Pool de conexiones a Postgres
// ============================================================
const { Pool, types } = require('pg');

// Postgres devuelve NUMERIC como string por defecto (precision-safe).
// Para nuestro caso (saldo, montos en dos decimales) es seguro
// convertir a Number para que la API responda numeros JSON.
types.setTypeParser(1700, (v) => v === null ? null : parseFloat(v));

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 5432),
  user:     process.env.DB_USER     || 'casino',
  password: process.env.DB_PASSWORD || 'casino',
  database: process.env.DB_NAME     || 'casino_db',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('[PG] error en cliente inactivo:', err));

async function esperarBD(maxIntentos = 30, esperaMs = 2000) {
  for (let i = 1; i <= maxIntentos; i++) {
    try {
      await pool.query('SELECT 1');
      console.log(`[PG] Conexion establecida (intento ${i})`);
      return;
    } catch (err) {
      console.log(`[PG] BD no disponible (intento ${i}/${maxIntentos}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, esperaMs));
    }
  }
  throw new Error('No se pudo conectar a Postgres');
}

module.exports = { pool, esperarBD };
