import React, { useEffect, useState } from "react";
import API from "../api";
import EventForm from "../components/EventForm";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await API.get("/events");
    setEvents(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = () => {
    setEditing(null);
    setShowForm(true);
  };

  const edit = (ev) => {
    setEditing(ev);
    setShowForm(true);
  };

  const remove = async (id) => {
    if (!confirm("Delete event?")) return;
    await API.delete(`/events/${id}`);
    load();
  };

  const submit = async (data) => {
    if (editing) {
      await API.put(`/events/${editing.event_id}`, data);
    } else {
      await API.post(`/events`, data);
    }
    setShowForm(false);
    load();
  };

  return (
    <div>
      <h2>Events</h2>
      <button onClick={create}>+ Add Event</button>
      <table border={1} cellPadding={8} style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Venue</th>
            <th>Seats</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.event_id}>
              <td>{e.title}</td>
              <td>{e.venue}</td>
              <td>
                {e.seats_taken}/{e.capacity}
              </td>
              <td>
                <button onClick={() => edit(e)}>Edit</button>
                <button onClick={() => remove(e.event_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <EventForm
          event={editing}
          onCancel={() => setShowForm(false)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
