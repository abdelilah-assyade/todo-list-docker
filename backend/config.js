require('dotenv').config();

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),

  // Which storage engine the repository should use: 'memory' or 'mysql'
  dbDriver: process.env.DB_DRIVER || 'memory',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todo_db',
    connectionLimit: toInt(process.env.DB_POOL_SIZE, 5),
  },
};