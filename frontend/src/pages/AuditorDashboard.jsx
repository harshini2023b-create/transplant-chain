import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { HOSPITALS_BY_DISTRICT, TN_CENTER, TN_ZOOM } from "../data/tamilnaduHospitals";

function createIcon(emoji, size = 28) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="font-size:${size}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ---------- Custody Event Block ---------- */
function CustodyBlock({ event, step, current }) {
  const env = event.linkedIoTReading?.data;
  return (
    <article className={`custody-block glass-panel ${current ? "custody-block--current" : ""}`}>
      <div className="custody-block__header">
        <span className="custody-block__step">Step {step}</span>
        {current && <span className="custody-block__tag">Current</span>}
      </div>
      <h3 className="custody-block__status">{event.status}</h3>
      <div className="custody-block__details">
        <div><strong>📍 Location:</strong> {event.location}</div>
        <div><strong>👤 Custodian:</strong> {event.custodian}</div>
        <div><strong>🕐 Time:</strong> {new Date(event.timestamp * 1000).toLocaleString()}</div>
      </div>
      {env && (
        <div className="custody-block__env">
          <h4>🌡️ Environment</h4>
          <div className="custody-block__env-grid">
            <div><strong>Temp:</strong> {env.temperature} °C</div>
            <div><strong>Humidity:</strong> {env.humidity} %</div>
            <div><strong>Coords:</strong> {env.latitude}, {env.longitude}</div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ---------- Audit Map ---------- */
function AuditMap({ events }) {
  // Find locations in our hospital DB that match
  const allHospitals = [];
  for (const [district, hospitals] of Object.entries(HOSPITALS_BY_DISTRICT)) {
    for (const h of hospitals) allHospitals.push({ ...h, district });
  }

  // Try to match event locations to GPS coords
  const points = events.map((ev) => {
    const match = allHospitals.find(
      (h) => ev.location?.includes(h.name) || ev.location?.includes(h.district)
    );
    if (match) return { lat: match.lat, lng: match.lng, label: ev.location, status: ev.status };
    // Try IoT reading
    const iot = ev.linkedIoTReading?.data;
    if (iot?.latitude && iot?.longitude)
      return { lat: iot.latitude, lng: iot.longitude, label: ev.location, status: ev.status };
    return null;
  }).filter(Boolean);

  if (points.length === 0) return null;

  return (
    <div className="audit-map-container">
      <MapContainer
        center={[points[0].lat, points[0].lng]}
        zoom={8}
        className="leaflet-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {/* Route line */}
        {points.length >= 2 && (
          <Polyline
            positions={points.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#0f766e", weight: 3, dashArray: "8, 6", opacity: 0.8 }}
          />
        )}
        {points.map((p, i) => (
          <Marker
            key={i}
            position={[p.lat, p.lng]}
            icon={createIcon(i === points.length - 1 ? "📍" : "🔵", i === points.length - 1 ? 32 : 22)}
          >
            <Popup>
              <strong>{p.status}</strong><br />
              {p.label}<br />
              <small>Step {i + 1}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function AuditorDashboard() {
  const { user } = useAuth();
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
    return () => { cancelled = true; };
  }, [organId]);

  function search(e) {
    e.preventDefault();
    const id = input.trim();
    if (id) navigate(`/audit/${encodeURIComponent(id)}`);
  }

  const loading = Boolean(organId) && result.id !== organId;
  const events = result.id === organId ? result.data?.custodyHistory ?? [] : [];
  const organ = result.data;

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              <span className="title-gradient">Auditor Dashboard</span>
            </h1>
            <p className="dashboard-subtitle">
              Full chain-of-custody audit trail with blockchain verification
            </p>
          </div>
          <div className="user-badge glass-panel">
            <span className="user-badge__icon">🔍</span>
            <div>
              <span className="user-badge__name">{user?.username}</span>
              <span className="user-badge__role">Auditor</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <section className="glass-panel" style={{ padding: "2rem" }}>
          <h2 className="section-title">
            <span className="section-icon">🔎</span>
            Audit Organ Chain
          </h2>
          <p className="section-desc">
            Enter an organ ID to see the complete chain-of-custody with blockchain verification.
          </p>
          <form onSubmit={search} className="modern-form" style={{ marginTop: "1rem" }}>
            <div className="form-row">
              <div className="input-group" style={{ flex: 1 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter Organ ID (e.g., KIDNEY-001)"
                  required
                />
              </div>
              <button type="submit" className="submit-btn glow-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : "🔍 Audit"}
              </button>
            </div>
          </form>

          {result.id === organId && result.error && (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>
              <span>⚠️</span> {result.error}
            </div>
          )}
        </section>

        {/* Results */}
        {organ && (
          <>
            {/* Organ Summary */}
            <section className="glass-panel" style={{ padding: "2rem", marginTop: "1.5rem" }}>
              <div className="audit-summary">
                <div className="audit-summary__header">
                  <h2>🫀 {organ.organId}</h2>
                  <span className={`status-badge ${events.length > 0 ? "status-delivered" : "status-registered"}`}>
                    {events.length > 0 ? events[events.length - 1].status : "Registered"}
                  </span>
                </div>
                <div className="audit-summary__grid">
                  <div><strong>Type:</strong> {organ.organType}</div>
                  <div><strong>Donor Hospital:</strong> {organ.donorHospital}</div>
                  <div><strong>Retrieval:</strong> {organ.retrievalLocation}</div>
                  <div><strong>Chain Events:</strong> {events.length}</div>
                  <div>
                    <strong>Blockchain:</strong>{" "}
                    <span className="text-green">
                      ✅ Verified (Block #{organ.blockchain?.blockNumber || "N/A"})
                    </span>
                  </div>
                  <div className="hash-row">
                    <strong>Fingerprint:</strong>{" "}
                    <span className="hash">{organ.hash || organ.blockchain?.transactionHash || "N/A"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Map */}
            {events.length > 0 && (
              <section className="glass-panel" style={{ padding: "2rem", marginTop: "1.5rem" }}>
                <h2 className="section-title">
                  <span className="section-icon">🗺️</span>
                  Chain Route Map
                </h2>
                <AuditMap events={events} />
              </section>
            )}

            {/* Timeline */}
            <section className="glass-panel" style={{ padding: "2rem", marginTop: "1.5rem" }}>
              <h2 className="section-title">
                <span className="section-icon">⛓️</span>
                Chain of Custody Timeline
              </h2>
              {events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">📋</div>
                  <p>No custody events recorded yet</p>
                </div>
              ) : (
                <div className="audit-timeline">
                  {events.map((event, i) => (
                    <div key={event.recordIndex || i} className="timeline-item">
                      <div className="timeline-connector">
                        <div className={`timeline-dot ${i === events.length - 1 ? "timeline-dot--current" : ""}`} />
                        {i < events.length - 1 && <div className="timeline-line" />}
                      </div>
                      <CustodyBlock
                        event={event}
                        step={i + 1}
                        current={i === events.length - 1}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
