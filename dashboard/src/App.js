import React, { useEffect, useState } from 'react';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const ws = new window.WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data);
      setEvents((prev) => [event, ...prev].slice(0, 20));
    };
    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Classroom Real-Time Dashboard</h1>
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
    </div>
  );
}

export default App;
