import React, { useEffect, useState } from "react";
import API from "../api";

export default function RegisterModal({ open, onClose, eventId, onRegistered }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await API.get('/users');
        setUsers(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/register', { user_id: Number(userId), event_id: Number(eventId) });
      onRegistered && onRegistered();
      onClose();
    } catch (err) {
      alert('Register failed: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <form style={{ background:'#fff', padding:20, width:440 }} onSubmit={submit}>
        <h3>Register for event #{eventId}</h3>
        <select required value={userId} onChange={e=>setUserId(e.target.value)} style={{ width:'100%', marginBottom:10 }}>
          <option value="">Select user</option>
          {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.email})</option>)}
        </select>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </div>
      </form>
    </div>
  );
}
