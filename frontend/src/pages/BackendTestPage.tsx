/**
 * Backend Connection Test Page
 * 
 * This page demonstrates the frontend connecting to the backend API.
 * It calls the /api/user-roles endpoint to verify the connection works.
 */

import { useEffect, useState } from "react";

interface UserRole {
  id: number;
  role_code: string;
  description: string;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data: UserRole[];
  count: number;
}

export function BackendTestPage() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Testing...");

  useEffect(() => {
    // Test backend connection
    const testConnection = async () => {
      try {
        setLoading(true);
        setError(null);
        setConnectionStatus("Connecting to backend...");

        // Call the backend API endpoint
        const response = await fetch('/api/user-roles');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        
        if (data.success && data.data) {
          setRoles(data.data);
          setConnectionStatus(`✅ Connected! Retrieved ${data.count} roles`);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setConnectionStatus(`❌ Connection failed: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Backend Connection Test</h1>
      
      <div style={{ 
        padding: '1rem', 
        marginBottom: '2rem', 
        backgroundColor: error ? '#fee' : '#efe',
        border: `2px solid ${error ? '#faa' : '#afa'}`,
        borderRadius: '8px'
      }}>
        <h2>Connection Status</h2>
        <p><strong>{connectionStatus}</strong></p>
        {error && (
          <div style={{ marginTop: '1rem', color: '#c00' }}>
            <p><strong>Error Details:</strong></p>
            <pre style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
              {error}
            </pre>
            <p style={{ marginTop: '1rem', fontSize: '0.9em' }}>
              <strong>Make sure:</strong>
            </p>
            <ul>
              <li>Backend server is running on http://localhost:3000</li>
              <li>Backend CORS is configured to allow frontend origin</li>
              <li>Database is set up and connected</li>
            </ul>
          </div>
        )}
      </div>

      {loading && <p>Loading user roles from backend...</p>}

      {!loading && !error && roles.length > 0 && (
        <div>
          <h2>User Roles from Database</h2>
          <p>Successfully retrieved {roles.length} roles from PostgreSQL database:</p>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            marginTop: '1rem',
            backgroundColor: '#fff',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Role Code</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{role.id}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{role.role_code}</td>
                  <td style={{ padding: '0.75rem' }}>{role.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>What This Test Shows</h3>
        <ul>
          <li>✅ Frontend can make HTTP requests to backend</li>
          <li>✅ Backend API is responding correctly</li>
          <li>✅ Database connection is working</li>
          <li>✅ Service → Database pattern is functional</li>
          <li>✅ CORS is configured correctly</li>
        </ul>
      </div>
    </div>
  );
}