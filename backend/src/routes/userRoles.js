/**
 * User Roles API Routes
 * 
 * This module defines RESTful API endpoints for user roles.
 * It demonstrates the complete flow: HTTP Request → Route → Service → Database
 */

import express from 'express';
import { getAllUserRoles, getUserRoleByCode, getUserRoleById } from '../services/userRoleService.js';

const router = express.Router();

/**
 * GET /api/user-roles
 * 
 * Retrieve all user roles from the database.
 * This endpoint demonstrates the complete request flow:
 * 1. HTTP GET request received
 * 2. Route handler calls service layer
 * 3. Service layer queries database
 * 4. Results returned as JSON response
 */
router.get('/', async (req, res) => {
  const start = Date.now();
  try {
    const roles = await getAllUserRoles();
    const serverTime = Date.now() - start;
    res.json({
      success: true,
      data: roles,
      count: roles.length,
      server_time_ms: serverTime
    });
  } catch (error) {
    console.error('Error in GET /api/user-roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user roles',
      message: error.message,
      server_time_ms: Date.now() - start
    });
  }
});

/**
 * GET /api/user-roles/:code
 * 
 * Retrieve a specific user role by role code.
 * 
 * @param {string} code - Role code (DESIGNER, REVIEWER, ADMIN)
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const role = await getUserRoleByCode(code.toUpperCase());
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: `No role found with code: ${code}`
      });
    }
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(`Error in GET /api/user-roles/${req.params.code}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user role',
      message: error.message
    });
  }
});

/**
 * GET /api/user-roles/id/:id
 * 
 * Retrieve a specific user role by ID.
 */
router.get('/id/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'ID must be a number'
      });
    }
    
    const role = await getUserRoleById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: `No role found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(`Error in GET /api/user-roles/id/${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user role',
      message: error.message
    });
  }
});

export default router;
