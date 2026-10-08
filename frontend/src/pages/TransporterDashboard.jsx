import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { HOSPITALS_BY_DISTRICT, TN_CENTER, TN_ZOOM, TAMIL_NADU_DISTRICTS } from "../data/tamilnaduHospitals";

/* ---------- Custom Map Icons ---------- */
function createIcon(emoji, size = 32) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="font-size:${size}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const senderIcon = createIcon("🏥", 36);
const receiverIcon = createIcon("🏨", 36);
const ambulanceIcon = createIcon("🚑", 40);

/* ---------- Animated marker component ---------- */
function AnimatedMarker({ from, to, duration = 15000, icon }) {
  const [pos, setPos] = useState(from);
  const startTimeRef = useRef(Date.now());
  const animFrameRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();

    function animate() {
      const elapsed = Date.now() - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      // Ease-in-out
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      setPos({
        lat: from.lat + (to.lat - from.lat) * ease,
        lng: from.lng + (to.lng - from.lng) * ease,
      });

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }
    animate();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [from, to, duration]);

  return (
    <Marker position={[pos.lat, pos.lng]} icon={icon}>
      <Popup>
        <div style={{ textAlign: "center", fontWeight: 600 }}>
          🚑 Organ in Transit<br />
          <small style={{ color: "#64748b" }}>
            {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
          </small>
        </div>
      </Popup>
    </Marker>
  );
}

/* ---------- Map auto-fit bounds ---------- */
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [points, map]);
  return null;
}

/* ---------- Route Path with dashes ---------- */
function RoutePath({ from, to }) {
  const positions = useMemo(() => {
    // Generate intermediate curved path
    const steps = 50;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = from.lat + (to.lat - from.lat) * t;
      const lng = from.lng + (to.lng - from.lng) * t;
      // Add slight curve
      const curve = Math.sin(t * Math.PI) * 0.3;
      path.push([lat + curve * 0.1, lng + curve * 0.2]);
    }
    return path;
  }, [from, to]);

  return (
    <>
      {/* Route line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#0f766e",
          weight: 4,
          opacity: 0.8,
          dashArray: "12, 8",
          lineCap: "round",
        }}
      />
    </>
  );
}

const STATUSES = ["Retrieved", "In Transit", "Transferred", "Received", "Delivered"];

export default function TransporterDashboard() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    organId: params.get("organId") || "",
    location: "",
    custodian: user?.username || "",
    status: "In Transit",
    senderDistrict: "",
    senderHospital: "",
    receiverDistrict: "",
    receiverHospital: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const senderHospitals = useMemo(
    () => (form.senderDistrict ? HOSPITALS_BY_DISTRICT[form.senderDistrict] || [] : []),
    [form.senderDistrict]
  );
  const receiverHospitals = useMemo(
    () => (form.receiverDistrict ? HOSPITALS_BY_DISTRICT[form.receiverDistrict] || [] : []),
    [form.receiverDistrict]
  );

  const senderCoords = useMemo(
    () => senderHospitals.find((h) => h.name === form.senderHospital),
    [senderHospitals, form.senderHospital]
  );
  const receiverCoords = useMemo(
    () => receiverHospitals.find((h) => h.name === form.receiverHospital),
    [receiverHospitals, form.receiverHospital]
  );

  const hasRoute = senderCoords && receiverCoords;

  function update(event) {
    const { name, value } = event.target;
    const updates = { [name]: value };
    if (name === "senderDistrict") updates.senderHospital = "";
    if (name === "receiverDistrict") updates.receiverHospital = "";
    if (name === "senderHospital") {
      const h = senderHospitals.find((x) => x.name === value);
      if (h) updates.location = `${h.name}, ${form.senderDistrict}`;
    }
    setForm((prev) => ({ ...prev, ...updates }));
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
          location: form.location.trim() || `${form.senderHospital}, ${form.senderDistrict}`,
          custodian: form.custodian.trim(),
          status: form.status,
        }),
      });
      setSaved(result);
      setIsAnimating(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const reading = saved?.automaticIoTReading;
  const mapCenter = hasRoute
    ? { lat: (senderCoords.lat + receiverCoords.lat) / 2, lng: (senderCoords.lng + receiverCoords.lng) / 2 }
    : TN_CENTER;

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              <span className="title-gradient">Transporter Dashboard</span>
            </h1>
            <p className="dashboard-subtitle">
              Track and record organ transport in real-time
            </p>
          </div>
          <div className="user-badge glass-panel">
            <span className="user-badge__icon">🚑</span>
            <div>
              <span className="user-badge__name">{user?.username}</span>
              <span className="user-badge__role">Transporter</span>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="map-section glass-panel">
          <h2 className="section-title">
            <span className="section-icon">🗺️</span>
            Live Transport Tracking — Tamil Nadu
          </h2>
          <div className="map-container">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={hasRoute ? 8 : TN_ZOOM}
              className="leaflet-map"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {hasRoute && (
                <>
                  <FitBounds points={[senderCoords, receiverCoords]} />
                  <RoutePath from={senderCoords} to={receiverCoords} />

                  <Marker position={[senderCoords.lat, senderCoords.lng]} icon={senderIcon}>
                    <Popup>
                      <strong>🏥 Sender</strong><br />
                      {form.senderHospital}<br />
                      <small>{form.senderDistrict}</small>
                    </Popup>
                  </Marker>

                  <Marker position={[receiverCoords.lat, receiverCoords.lng]} icon={receiverIcon}>
                    <Popup>
                      <strong>🏨 Receiver</strong><br />
                      {form.receiverHospital}<br />
                      <small>{form.receiverDistrict}</small>
                    </Popup>
                  </Marker>

                  {isAnimating && (
                    <AnimatedMarker
                      from={senderCoords}
                      to={receiverCoords}
                      duration={20000}
                      icon={ambulanceIcon}
                    />
                  )}
                </>
              )}

              {!hasRoute && (
                <Marker position={[TN_CENTER.lat, TN_CENTER.lng]} icon={createIcon("📍", 30)}>
                  <Popup>Tamil Nadu — Select route to see tracking</Popup>
                </Marker>
              )}
            </MapContainer>

            {!hasRoute && (
              <div className="map-overlay">
                <div className="map-overlay__content">
                  <span className="map-overlay__icon">🗺️</span>
                  <p>Select sender and receiver hospitals to see the transport route</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Form and Info */}
        <div className="dashboard-grid">
          <section className="form-section glass-panel">
            <h2 className="section-title">
              <span className="section-icon">📦</span>
              Record Transport Event
            </h2>

            <form onSubmit={submit} className="modern-form">
              <div className="form-row">
                <div className="input-group">
                  <label>Organ ID</label>
                  <input
                    name="organId"
                    value={form.organId}
                    onChange={update}
                    placeholder="KIDNEY-001"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={update}>
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Custodian</label>
                <input
                  name="custodian"
                  value={form.custodian}
                  onChange={update}
                  required
                />
              </div>

              {/* Sender */}
              <div className="location-section">
                <h3 className="location-title"><span>📍</span> Pickup Location</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>District</label>
                    <select name="senderDistrict" value={form.senderDistrict} onChange={update} required>
                      <option value="">Select...</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Hospital</label>
                    <select name="senderHospital" value={form.senderHospital} onChange={update} required disabled={!form.senderDistrict}>
                      <option value="">{form.senderDistrict ? "Select..." : "Select district first"}</option>
                      {senderHospitals.map((h) => (
                        <option key={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Receiver */}
              <div className="location-section">
                <h3 className="location-title"><span>🏨</span> Delivery Location</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>District</label>
                    <select name="receiverDistrict" value={form.receiverDistrict} onChange={update} required>
                      <option value="">Select...</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Hospital</label>
                    <select name="receiverHospital" value={form.receiverHospital} onChange={update} required disabled={!form.receiverDistrict}>
                      <option value="">{form.receiverDistrict ? "Select..." : "Select district first"}</option>
                      {receiverHospitals.map((h) => (
                        <option key={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn glow-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : <><span>🚑</span> Record Transport &amp; Start Tracking</>}
              </button>
            </form>

            {error && (
              <div className="alert alert-error"><span>⚠️</span> {error}</div>
            )}

            {saved && (
              <div className="alert alert-success">
                <h3>✅ Transport event recorded!</h3>
                <div className="alert-details">
                  <div><strong>Status:</strong> {saved.status}</div>
                  <div><strong>Location:</strong> {saved.location}</div>
                  <div><strong>Block #:</strong> {saved.blockchain?.blockNumber}</div>
                  {reading && (
                    <>
                      <div><strong>Temperature:</strong> {reading.temperature} °C</div>
                      <div><strong>Humidity:</strong> {reading.humidity} %</div>
                      <div><strong>Coordinates:</strong> {reading.latitude}, {reading.longitude}</div>
                    </>
                  )}
                </div>
                <Link className="alert-action glow-btn" to={`/history/${encodeURIComponent(saved.organId)}`}>
                  📊 View Full History
                </Link>
              </div>
            )}
          </section>

          {/* Route Info */}
          <section className="activity-section glass-panel">
            <h2 className="section-title">
              <span className="section-icon">📍</span>
              Route Information
            </h2>
            {hasRoute ? (
              <div className="route-info">
                <div className="route-point">
                  <div className="route-point__dot" style={{ background: "#0f766e" }} />
                  <div>
                    <strong>{form.senderHospital}</strong>
                    <span>{form.senderDistrict}</span>
                    <small>
                      {senderCoords.lat.toFixed(4)}°N, {senderCoords.lng.toFixed(4)}°E
                    </small>
                  </div>
                </div>
                <div className="route-line" />
                <div className="route-point">
                  <div className="route-point__dot" style={{ background: "#15803d" }} />
                  <div>
                    <strong>{form.receiverHospital}</strong>
                    <span>{form.receiverDistrict}</span>
                    <small>
                      {receiverCoords.lat.toFixed(4)}°N, {receiverCoords.lng.toFixed(4)}°E
                    </small>
                  </div>
                </div>
                <div className="route-stats">
                  <div className="route-stat">
                    <span className="route-stat__label">Distance</span>
                    <span className="route-stat__value">
                      {(
                        Math.sqrt(
                          Math.pow((senderCoords.lat - receiverCoords.lat) * 111, 2) +
                          Math.pow((senderCoords.lng - receiverCoords.lng) * 85, 2)
                        )
                      ).toFixed(1)} km (approx)
                    </span>
                  </div>
                  <div className="route-stat">
                    <span className="route-stat__label">Status</span>
                    <span className="route-stat__value">
                      {isAnimating ? "🟢 In Transit" : "⚪ Awaiting Dispatch"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">🗺️</div>
                <p>No route selected</p>
                <p className="empty-state__hint">
                  Select pickup and delivery hospitals to see route details
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
