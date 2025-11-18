// frontend/src/pages/RegistrationsPage.jsx
import React, { useEffect, useState } from "react";
import API from "../api";

export default function RegistrationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // quick form state to register without leaving page
  const [form, setForm] = useState({ user_id: "", event_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/registrations");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to load registrations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (reg_id, status) => {
    try {
      await API.put(`/registrations/${reg_id}`, { status });
      await load();
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.event_id) return alert("Select user and event ids.");
    setSubmitting(true);
    try {
      const res = await API.post("/register", { user_id: Number(form.user_id), event_id: Number(form.event_id) });
      alert(res.data.message || "Registered");
      setForm({ user_id: "", event_id: "" });
      await load();
    } catch (err) {
      console.error(err);
      alert("Registration failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Registrations</h2>

      <section style={{ marginBottom: 16, border: "1px solid #eee", padding: 12, borderRadius: 6 }}>
        <h4>Quick Register (by IDs)</h4>
        <form onSubmit={submitRegistration} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="user_id (e.g. 2)" value={form.user_id} onChange={e=>setForm({...form, user_id: e.target.value})} />
          <input placeholder="event_id (e.g. 1)" value={form.event_id} onChange={e=>setForm({...form, event_id: e.target.value})} />
          <button type="submit" disabled={submitting}>{submitting ? "Registering..." : "Register"}</button>
          <button type="button" onClick={load}>Refresh</button>
        </form>
        <div style={{ marginTop: 8, color: "#666" }}>
          Tip: use the Users page to see user ids and Events page for event ids.
        </div>
      </section>

      {loading && <div>Loading registrations…</div>}
      {error && <div style={{ color: "crimson" }}>Error: {error}</div>}

      {!loading && rows.length === 0 && <div>No registrations found.</div>}

      {!loading && rows.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Reg ID</th>
              <th>User</th>
              <th>Event</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.reg_id}>
                <td>{r.reg_id}</td>
                <td>{r.user_name} ({r.user_email})</td>
                <td>{r.event_title} @ {r.event_venue} (#{r.event_id})</td>
                <td>{r.status}</td>
                <td>{r.reg_time}</td>
                <td>
                  {r.status !== 'cancelled' && <button onClick={() => setStatus(r.reg_id, 'cancelled')}>Cancel</button>}
                  {r.status !== 'registered' && <button onClick={() => setStatus(r.reg_id, 'registered')} style={{ marginLeft: 8 }}>Re-register</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
