import React, { useState } from "react";

export default function EventForm({ event, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    venue: event?.venue || "",
    start_time: event?.start_time
      ? event.start_time.slice(0, 19).replace(" ", "T")
      : "",
    end_time: event?.end_time
      ? event.end_time.slice(0, 19).replace(" ", "T")
      : "",
    capacity: event?.capacity || 50,
    created_by: 1, // admin user id
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      start_time: form.start_time.replace("T", " "),
      end_time: form.end_time.replace("T", " "),
      capacity: Number(form.capacity),
    };
    onSubmit(payload);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <form style={{ background: "white", padding: 20, width: 500 }} onSubmit={submit}>
        <h3>{event ? "Edit Event" : "Create Event"}</h3>

        <input
          placeholder="Event Title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
          required
        />

        <input
          placeholder="Venue"
          value={form.venue}
          onChange={(e) => update("venue", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Start time</label>
        <input
          type="datetime-local"
          value={form.start_time}
          onChange={(e) => update("start_time", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>End time</label>
        <input
          type="datetime-local"
          value={form.end_time}
          onChange={(e) => update("end_time", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Capacity</label>
        <input
          type="number"
          value={form.capacity}
          onChange={(e) => update("capacity", e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          style={{ width: "100%", height: 80, marginBottom: 10 }}
        />

        <button type="submit" style={{ marginRight: 10 }}>
          Save
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}
