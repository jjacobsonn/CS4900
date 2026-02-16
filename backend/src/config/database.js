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
 * Create a new PostgreSQL connection pool
 * 
 * The pool manages multiple database connections and automatically handles:
 * - Connection creation and destruction
 * - Connection reuse for better performance
 * - Error handling and connection recovery
 * 
 * Configuration is loaded from environment variables:
 * - DB_HOST: Database server hostname (default: localhost)
 * - DB_PORT: Database server port (default: 5432)
 * - DB_NAME: Database name (vellum)
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vellum',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

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
