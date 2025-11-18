// frontend/src/pages/QueriesPage.jsx
import React, { useEffect, useState } from "react";
import API from "../api";

export default function QueriesPage() {
  const [nested, setNested] = useState([]);
  const [joinQ, setJoinQ] = useState([]);
  const [agg, setAgg] = useState([]);
  const [minRating, setMinRating] = useState(4);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingAgg, setLoadingAgg] = useState(false);
  const [loadingNested, setLoadingNested] = useState(false);
  const [error, setError] = useState(null);

  async function loadJoinAndAgg() {
    setError(null);
    setLoadingJoin(true); setLoadingAgg(true);
    try {
      const [joinRes, aggRes] = await Promise.all([
        API.get('/queries/join'),
        API.get('/queries/aggregate')
      ]);
      setJoinQ(Array.isArray(joinRes.data) ? joinRes.data : []);
      setAgg(Array.isArray(aggRes.data) ? aggRes.data : []);
    } catch (err) {
      console.error("Join/Aggregate load failed:", err);
      setError(err.response?.data?.error || err.message || "Failed to load queries");
    } finally {
      setLoadingJoin(false); setLoadingAgg(false);
    }
  }

  async function runNested() {
    setLoadingNested(true);
    setError(null);
    try {
      const res = await API.get('/queries/nested', { params: { minRating }});
      setNested(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Nested query failed:", err);
      setError(err.response?.data?.error || err.message || "Nested query failed");
      setNested([]);
    } finally {
      setLoadingNested(false);
    }
  }

  useEffect(() => {
    loadJoinAndAgg();
  }, []);

  return (
    <div>
      <h2>Queries</h2>

      {error && <div style={{ color: "crimson", marginBottom: 10 }}>Error: {String(error)}</div>}

      <section style={{ marginBottom: 20 }}>
        <h3>Nested Query</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <label>min avg rating: <input type="number" value={minRating} onChange={e=>setMinRating(Number(e.target.value))} style={{ width:60, marginLeft:8 }} /></label>
          <button onClick={runNested}>Run Nested Query</button>
          <button onClick={()=>{ setNested([]); setMinRating(4); }}>Reset</button>
        </div>
        {loadingNested ? <div>Running nested query…</div> : (
          <table border="1" cellPadding="6" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th>User</th><th>Email</th><th>Event ID</th><th>Event Title</th></tr></thead>
            <tbody>
              {nested.length === 0 && <tr><td colSpan="4">No rows</td></tr>}
              {nested.map((r, i) => <tr key={i}><td>{r.name}</td><td>{r.email}</td><td>{r.event_id}</td><td>{r.title}</td></tr>)}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3>Join Query (registrations)</h3>
        {loadingJoin ? <div>Loading join query…</div> : (
          <table border="1" cellPadding="6" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th>Reg ID</th><th>User</th><th>Event</th><th>Status</th></tr></thead>
            <tbody>
              {joinQ.length === 0 && <tr><td colSpan="4">No rows</td></tr>}
              {joinQ.map(r => (
                <tr key={r.reg_id}>
                  <td>{r.reg_id}</td>
                  <td>{r.user_name} ({r.user_email})</td>
                  <td>{r.event_title} @{r.venue}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3>Aggregate Query (events with avg rating & occupancy)</h3>
        {loadingAgg ? <div>Loading aggregate…</div> : (
          <table border="1" cellPadding="6" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><th>Event</th><th>Capacity</th><th>Seats</th><th>Avg Rating</th><th>Occupancy %</th></tr></thead>
            <tbody>
              {agg.length === 0 && <tr><td colSpan="5">No rows</td></tr>}
              {agg.map(a => (
                <tr key={a.event_id}>
                  <td>{a.title}</td>
                  <td>{a.capacity}</td>
                  <td>{a.seats_taken}</td>
                  <td>{a.avg_rating}</td>
                  <td>{a.occupancy_percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </div>
  );
}
