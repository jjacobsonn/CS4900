/**
 * Vellum Backend Server
 * 
 * Express.js server for the Vellum API.
 * This server provides RESTful endpoints for the digital asset review platform.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import userRolesRouter from './routes/userRoles.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend connections
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Vellum API'
  });
});

// API Routes
app.use('/api/user-roles', userRolesRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Vellum API Server',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      userRoles: '/api/user-roles'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection before starting server
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Server not started.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Vellum API Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`👥 User Roles API: http://localhost:${PORT}/api/user-roles`);
      console.log(`\nDatabase connection: ✅ Connected\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
