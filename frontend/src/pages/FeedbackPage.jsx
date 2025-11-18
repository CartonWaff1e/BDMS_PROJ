import React, { useEffect, useState } from "react";
import API from "../api";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ user_id: 2, event_id: "", rating: 5, comments: "" });

  const load = async () => {
    try {
      const [fRes, eRes] = await Promise.all([API.get('/feedback'), API.get('/events')]);
      setFeedback(fRes.data);
      setEvents(eRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load feedback or events');
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/feedback', form);
      setForm(prev => ({ ...prev, comments: '' }));
      load();
    } catch (err) {
      console.error(err);
      alert('Submit failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <h2>Feedback</h2>

      <form onSubmit={submit} style={{ marginBottom: 16 }}>
        <div>
          <label>Event</label><br/>
          <select value={form.event_id} onChange={e=>setForm({...form,event_id: e.target.value})} required>
            <option value="">Select event</option>
            {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>)}
          </select>
        </div>

        <div>
          <label>Rating</label><br/>
          <input type="number" min="1" max="5" value={form.rating} onChange={e=>setForm({...form,rating: Number(e.target.value)})} />
        </div>

        <div>
          <label>Comments</label><br/>
          <input value={form.comments} onChange={e=>setForm({...form,comments: e.target.value})} />
        </div>

        <div style={{ marginTop:8 }}>
          <button type="submit">Submit</button>
        </div>
      </form>

      <h3>Recent feedback</h3>
      <table border="1" cellPadding="8" style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><th>User</th><th>Event</th><th>Rating</th><th>Comments</th><th>Time</th></tr></thead>
        <tbody>
          {feedback.map(f => (
            <tr key={f.feed_id}>
              <td>{f.user_name}</td>
              <td>{f.event_title}</td>
              <td>{f.rating}</td>
              <td>{f.comments}</td>
              <td>{f.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
