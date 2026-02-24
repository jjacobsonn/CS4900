/**
 * Backend Connection Test Page
 * 
 * This page demonstrates the frontend connecting to the backend API.
 * It calls the /api/user-roles endpoint to verify the connection works.
 */

import { useEffect, useState } from "react";

type RoleRow = {
  id: number;
  role_code: string;
  description: string;
  created_at: string;
};

type HealthResult = {
  status: string;
  service: string;
  timestamp: string;
};

export function BackendTestPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [assetsCount, setAssetsCount] = useState<number | null>(null);
  const [rolesCount, setRolesCount] = useState<number | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const runChecks = async () => {
      setLoading(true);
      setError(null);
      const nextTimings: Record<string, number> = {};

      try {
        // /api/health
        const t0 = performance.now();
        const hRes = await fetch('/api/health');
        nextTimings.health = Math.round(performance.now() - t0);
        if (!hRes.ok) throw new Error(`/api/health returned ${hRes.status}`);
        const hJson = await hRes.json();
        setHealth(hJson as HealthResult);

        // /api/user-roles
        const t1 = performance.now();
        const rRes = await fetch('/api/user-roles');
        nextTimings.userRoles = Math.round(performance.now() - t1);
        if (!rRes.ok) throw new Error(`/api/user-roles returned ${rRes.status}`);
        const rJson = await rRes.json();
        if (!rJson.success || !Array.isArray(rJson.data)) throw new Error('Unexpected user-roles response');
        setRoles(rJson.data as RoleRow[]);
        setRolesCount(Number(rJson.count ?? rJson.data.length));
        // include server processing time if provided by the API
        if (typeof rJson.server_time_ms === 'number') {
          nextTimings.userRolesServer = Math.round(rJson.server_time_ms);
        }

        // /api/assets (returns array)
        const t2 = performance.now();
        const aRes = await fetch('/api/assets');
        nextTimings.assets = Math.round(performance.now() - t2);
        if (!aRes.ok) throw new Error(`/api/assets returned ${aRes.status}`);
        const aJson = await aRes.json();
        if (!Array.isArray(aJson)) throw new Error('Unexpected assets response');
        setAssetsCount(aJson.length);
        // server processing time exposed as header X-Server-Time-Ms
        const aServer = aRes.headers.get('X-Server-Time-Ms');
        if (aServer) nextTimings.assetsServer = Math.round(Number(aServer));

        // /api/assets/summary (grouped counts by status)
        const t3 = performance.now();
        const sRes = await fetch('/api/assets/summary');
        nextTimings.assetsSummary = Math.round(performance.now() - t3);
        if (!sRes.ok) throw new Error(`/api/assets/summary returned ${sRes.status}`);
        const sJson = await sRes.json();
        if (sJson && typeof sJson.summary === 'object') {
          setSummary(sJson.summary);
          if (typeof sJson.server_time_ms === 'number') nextTimings.assetsSummaryServer = Math.round(sJson.server_time_ms);
        }

        setTimings(nextTimings);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void runChecks();
  }, []);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <h1>Backend Connectivity & Data Test</h1>

      <section style={{ marginBottom: 16 }}>
        <h2>Summary</h2>
        {loading ? (
          <p>Running checks against backend...</p>
        ) : error ? (
          <div style={{ color: '#900' }}>
            <p><strong>Failure:</strong> {error}</p>
            <p>Check backend server, database, and network configuration.</p>
          </div>
        ) : (
          <div>
            <p>Health: <strong>{health?.status ?? 'unknown'}</strong> — service: <em>{health?.service}</em></p>
            <p>Assets in DB: <strong>{assetsCount}</strong></p>
            <p>User roles in DB: <strong>{rolesCount}</strong></p>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>Timings (ms)</h2>
        <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(timings, null, 2)}</pre>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>Assets Summary (server grouping)</h2>
        {loading ? (
          <p>Loading summary...</p>
        ) : summary == null ? (
          <p>No summary available.</p>
        ) : (
          <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(summary, null, 2)}</pre>
        )}
      </section>

      <section>
        <h2>User Roles (raw)</h2>
        {loading ? (
          <p>Loading roles...</p>
        ) : roles.length === 0 ? (
          <p>No roles returned.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Code</th>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.id}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.role_code}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.description}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}