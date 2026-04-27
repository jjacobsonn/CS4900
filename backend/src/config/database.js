/**
 * Database Connection Module
 * 
 * This module provides a PostgreSQL connection pool for the Vellum application.
 * It uses the 'pg' library to establish and manage database connections.
 * 
 * Connection pooling allows the application to reuse database connections,
 * improving performance and reducing overhead from creating new connections.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

/**
 * Build pool options for local dev (`DB_*`) or hosted Postgres (single URL).
 *
 * Render-style: set `DATABASE_URL` to the Internal or External Postgres URL and
 * you do not need to split host/user/password manually.
 *
 * Optional: `DB_SSL=true` forces TLS with relaxed cert checks (some cloud DBs).
 */
function buildPoolOptions() {
  const connectionString = (
    process.env.DATABASE_URL ||
    process.env.DATABASE_INTERNAL_URL ||
    ''
  ).trim();

  const base = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };

  if (connectionString) {
    const opts = { ...base, connectionString };
    let hostForSsl = '';
    try {
      const u = new URL(connectionString.replace(/^postgres(ql)?:/i, 'http:'));
      hostForSsl = u.hostname || '';
    } catch {
      hostForSsl = '';
    }
    const wantsSsl =
      process.env.DB_SSL === 'true' ||
      /(^|\.)render\.com$/i.test(hostForSsl) ||
      /sslmode=require/i.test(connectionString);
    if (wantsSsl) {
      opts.ssl = { rejectUnauthorized: false };
    }
    return opts;
  }

  return {
    ...base,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'vellum',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  };
}

const pool = new Pool(buildPoolOptions());

/**
 * Test database connection
 * 
 * This function verifies that the database connection is working correctly.
 * It executes a simple SELECT query to check connectivity.
 * 
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}

/**
 * Get a client from the connection pool
 * 
 * This function retrieves a client from the pool for executing queries.
 * The client should be released back to the pool after use.
 * 
 * @returns {Promise<PoolClient>} A database client from the pool
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Execute a query using the connection pool
 * 
 * This is a convenience function that executes a query and automatically
 * handles connection management. For transactions or multiple queries,
 * use getClient() instead.
 * 
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters (for parameterized queries)
 * @returns {Promise<QueryResult>} Query result object
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * Close all database connections
 * 
 * This function should be called when shutting down the application
 * to properly close all database connections.
 */
export async function closePool() {
  await pool.end();
  console.log('Database pool closed');
}

// Export the pool for advanced usage
export default pool;
