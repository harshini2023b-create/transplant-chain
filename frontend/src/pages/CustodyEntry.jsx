import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

const STATUSES = ["Retrieved", "In Transit", "Transferred", "Received", "Delivered"];

export default function CustodyEntry() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    organId: params.get("organId") || "",
    location: "",
    custodian: "",
    status: STATUSES[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaved(null);
    try {
      const result = await api("/api/custody/events", {
        method: "POST",
        body: JSON.stringify({
          organId: form.organId.trim(),
          location: form.location.trim(),
          custodian: form.custodian.trim(),
          status: form.status,
        }),
      });
      setSaved(result);
      setForm({ ...form, location: "", custodian: "", status: STATUSES[0] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const reading = saved?.automaticIoTReading;

  return (
    <div className="page narrow">
      <h1>Record custody change</h1>
      <p className="lead">
        Each entry logs who holds the organ and where. Environment readings are
        captured automatically.
      </p>

      <form onSubmit={submit} className="form">
        <label>
          Organ ID
          <input
            name="organId"
            value={form.organId}
            onChange={update}
            placeholder="KIDNEY-001"
            required
          />
        </label>

        <label>
          Current location
          <input
            name="location"
            value={form.location}
            onChange={update}
            required
          />
        </label>

        <label>
          Custodian
          <input
            name="custodian"
            value={form.custodian}
            onChange={update}
            required
          />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={update}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Recording…" : "Record custody change"}
        </button>
      </form>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {saved && (
        <section className="notice success" aria-live="polite">
          <h2>Custody change recorded</h2>
          <dl className="facts">
            <dt>Status</dt>
            <dd>{saved.status}</dd>
            <dt>Location</dt>
            <dd>{saved.location}</dd>
            <dt>Blockchain block</dt>
            <dd>{saved.blockchain?.blockNumber}</dd>
            {reading && (
              <>
                <dt>Temperature</dt>
                <dd>{reading.temperature} °C</dd>
                <dt>Humidity</dt>
                <dd>{reading.humidity} %</dd>
                <dt>Coordinates</dt>
                <dd>
                  {reading.latitude}, {reading.longitude}
                </dd>
              </>
            )}
          </dl>
          <Link
            className="button secondary"
            to={`/history/${encodeURIComponent(saved.organId)}`}
          >
            View custody history
          </Link>
        </section>
      )}
    </div>
  );
}
