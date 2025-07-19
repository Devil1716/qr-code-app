import React, { useEffect, useState } from 'react';

const ZONES = ['A', 'B', 'C'];
const zoneColors = {
  good: '#b9fbc0',
  warning: '#ffe066',
  critical: '#ff6f59',
  no_data: '#e0e0e0',
};

function getZoneStatus(stats) {
  if (!stats) return 'no_data';
  if (stats.disengaged > 0) return 'critical';
  if (stats.face_present === 0) return 'warning';
  return 'good';
}

function App() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [zoneStats, setZoneStats] = useState({});

  useEffect(() => {
    const ws = new window.WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.alert) {
        setAlerts((prev) => [data.alert, ...prev].slice(0, 5));
      } else {
        setEvents((prev) => [data, ...prev].slice(0, 20));
        // Update zone stats
        setZoneStats((prev) => {
          const zone = data.zone || 'A';
          const stats = prev[zone] || { face_present: 0, disengaged: 0, count: 0 };
          return {
            ...prev,
            [zone]: {
              face_present: stats.face_present + (data.face_present || 0),
              disengaged: stats.disengaged + (data.disengaged || 0),
              count: stats.count + 1,
            },
          };
        });
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Classroom Real-Time Dashboard</h1>
      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{ background: '#ffef96', padding: 8, marginBottom: 4, borderRadius: 4 }}>
              <b>ALERT:</b> {alert.msg}
            </div>
          ))}
        </div>
      )}
      {/* Zone Heatmap */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {ZONES.map((zone) => {
          const stats = zoneStats[zone];
          const status = getZoneStatus(stats);
          return (
            <div key={zone} style={{ background: zoneColors[status], padding: 24, borderRadius: 8, minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: 18 }}>Zone {zone}</div>
              <div>Status: {status}</div>
              <div>Events: {stats ? stats.count : 0}</div>
            </div>
          );
        })}
      </div>
      {/* Live Event Table */}
      <table border="1" cellPadding="8" data-testid="attendance-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Zone</th>
            <th>Face Present</th>
            <th>Liveness</th>
            <th>Hand Raised</th>
            <th>Disengaged</th>
            <th>Audio Level</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i}>
              <td>{new Date(e.timestamp * 1000).toLocaleTimeString()}</td>
              <td>{e.zone}</td>
              <td>{e.face_present}</td>
              <td>{e.liveness_score}</td>
              <td>{e.hand_raised}</td>
              <td>{e.disengaged}</td>
              <td>{e.audio_level?.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Poll/Quiz Results (Stub) */}
      <div style={{ marginTop: 32 }}>
        <h2>Live Poll/Quiz Results (Stub)</h2>
        <div>Coming soon...</div>
      </div>
    </div>
  );
}

export default App;
