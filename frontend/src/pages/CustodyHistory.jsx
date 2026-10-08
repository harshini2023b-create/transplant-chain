import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

function Block({ event, step, current }) {
  const env = event.linkedIoTReading?.data;

  return (
    <article className={current ? "block current" : "block"}>
      <p className="step">
        Step {step}
        {current && <span className="tag">Current</span>}
      </p>
      <h3>{event.status}</h3>

      <dl>
        <dt>Location</dt>
        <dd>{event.location}</dd>
        <dt>Custodian</dt>
        <dd>{event.custodian}</dd>
        <dt>Recorded</dt>
        <dd>{new Date(event.timestamp * 1000).toLocaleString()}</dd>
      </dl>

      <div className="env">
        <h4>Environment</h4>
        {env ? (
          <dl>
            <dt>Temperature</dt>
            <dd>{env.temperature} °C</dd>
            <dt>Humidity</dt>
            <dd>{env.humidity} %</dd>
            <dt>Coordinates</dt>
            <dd>
              {env.latitude}, {env.longitude}
            </dd>
          </dl>
        ) : (
          <p className="muted">No reading linked to this change.</p>
        )}
      </div>
    </article>
  );
}

export default function CustodyHistory() {
  const { organId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(organId || "");
  const [result, setResult] = useState({ id: null, data: null, error: "" });

  useEffect(() => {
    if (!organId) return;
    let cancelled = false;
    api(`/api/audit/${encodeURIComponent(organId)}`)
      .then((data) => {
        if (!cancelled) setResult({ id: organId, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setResult({ id: organId, data: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [organId]);

  function search(event) {
    event.preventDefault();
    const id = input.trim();
    if (id) navigate(`/history/${encodeURIComponent(id)}`);
  }

  const loading = Boolean(organId) && result.id !== organId;
  const events = result.id === organId ? result.data?.custodyHistory ?? [] : [];

  return (
    <div className="page">
      <div className="narrow">
        <h1>Custody history</h1>
        <p className="lead">
          Enter an organ ID to see every change of custody, in order.
        </p>

        <form onSubmit={search} className="inline-form">
          <input
            aria-label="Organ ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="KIDNEY-001"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Loading…" : "Show history"}
          </button>
        </form>

        {result.id === organId && result.error && (
          <p className="notice error" role="alert">
            {result.error}
          </p>
        )}
      </div>

      {result.id === organId && result.data && (
        <section className="history">
          <div className="narrow">
            <h2>{result.data.organId}</h2>
            <p className="muted">
              {events.length} custody{" "}
              {events.length === 1 ? "change" : "changes"}
            </p>
          </div>

          {events.length === 0 ? (
            <div className="narrow">
              <p className="notice">
                No custody changes have been recorded for this organ yet.
              </p>
            </div>
          ) : (
            <div className="flow-scroll" tabIndex={0}>
              <ol className="flow">
                {events.map((event, i) => (
                  <li key={event.recordIndex}>
                    <Block
                      event={event}
                      step={i + 1}
                      current={i === events.length - 1}
                    />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
