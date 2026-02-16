/**
 * User Role Service
 * 
 * This service demonstrates how to connect to the database and retrieve data.
 * It provides an example of the service → database connection pattern required
 * for the Sprint 1 Review.
 * 
 * This service interacts with the user_roles lookup table, which contains
 * normalized role data (DESIGNER, REVIEWER, ADMIN).
 */

import { query } from '../config/database.js';

/**
 * Get all user roles from the database
 * 
 * This function queries the user_roles lookup table to retrieve all available
 * roles in the system. This demonstrates:
 * 1. Service layer calling database connection module
 * 2. Parameterized query execution
 * 3. Error handling
 * 4. Data transformation
 * 
 * @returns {Promise<Array>} Array of user role objects with id, role_code, and description
 * @throws {Error} If database query fails
 */
export async function getAllUserRoles() {
  try {
    // Execute parameterized query to prevent SQL injection
    const result = await query(
      'SELECT id, role_code, description, created_at FROM user_roles ORDER BY id'
    );
    
    // Return the rows from the query result
    return result.rows;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw new Error(`Failed to fetch user roles: ${error.message}`);
  }
}

/**
 * Get a user role by role code
 * 
 * This function demonstrates querying with a WHERE clause and parameterized queries.
 * 
 * @param {string} roleCode - The role code to look up (e.g., 'DESIGNER', 'REVIEWER', 'ADMIN')
 * @returns {Promise<Object|null>} User role object or null if not found
 * @throws {Error} If database query fails
 */
export async function getUserRoleByCode(roleCode) {
  try {
    // Parameterized query prevents SQL injection
    const result = await query(
      'SELECT id, role_code, description, created_at FROM user_roles WHERE role_code = $1',
      [roleCode]
    );
    
    // Return first row if found, null otherwise
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching user role ${roleCode}:`, error);
    throw new Error(`Failed to fetch user role: ${error.message}`);
  }
}

/**
 * Get a user role by ID
 * 
 * @param {number} id - The role ID
 * @returns {Promise<Object|null>} User role object or null if not found
 * @throws {Error} If database query fails
 */
export async function getUserRoleById(id) {
  try {
    const result = await query(
      'SELECT id, role_code, description, created_at FROM user_roles WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching user role by ID ${id}:`, error);
    throw new Error(`Failed to fetch user role: ${error.message}`);
  }
}
