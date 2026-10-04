// Creates the MySQL connection pool. Stage 3+.
// mysql2/promise gives us await pool.query(...) instead of callback nesting.
const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
      dateStrings: true,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function init() {
  const connection = await getPool().getConnection();
  try {
    await connection.query('SELECT 1');
    console.log('[db] connected to mysql://' + config.db.host + ':' + config.db.port + '/' + config.db.database);
  } finally {
    connection.release();
  }
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, init, close };