import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  TAMIL_NADU_DISTRICTS,
  HOSPITALS_BY_DISTRICT,
} from "../data/tamilnaduHospitals";

/* ---------- Stats Card ---------- */
function StatsCard({ icon, label, value, color }) {
  return (
    <div className="stats-card glass-panel" style={{ "--card-accent": color }}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__data">
        <span className="stats-card__value">{value}</span>
        <span className="stats-card__label">{label}</span>
      </div>
    </div>
  );
}

const EMPTY = {
  organId: "",
  organType: "Kidney",
  senderDistrict: "",
  donorHospital: "",
  receiverDistrict: "",
  receiverHospital: "",
  retrievalLocation: "",
};

export default function SenderDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(null);
  const [recentOrgans, setRecentOrgans] = useState([]);

  // Get hospitals for selected sender district
  const senderHospitals = useMemo(
    () => (form.senderDistrict ? HOSPITALS_BY_DISTRICT[form.senderDistrict] || [] : []),
    [form.senderDistrict]
  );

  // Get hospitals for selected receiver district
  const receiverHospitals = useMemo(
    () => (form.receiverDistrict ? HOSPITALS_BY_DISTRICT[form.receiverDistrict] || [] : []),
    [form.receiverDistrict]
  );

  function update(event) {
    const { name, value } = event.target;
    const updates = { [name]: value };
    // Reset dependent fields
    if (name === "senderDistrict") {
      updates.donorHospital = "";
      updates.retrievalLocation = "";
    }
    if (name === "receiverDistrict") {
      updates.receiverHospital = "";
    }
    if (name === "donorHospital") {
      const hosp = senderHospitals.find((h) => h.name === value);
      if (hosp) updates.retrievalLocation = `${hosp.name}, ${form.senderDistrict}`;
    }
    setForm((prev) => ({ ...prev, ...updates }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRegistered(null);
    try {
      const organ = await api("/api/organs", {
        method: "POST",
        body: JSON.stringify({
          organId: form.organId.trim(),
          organType: form.organType,
          donorHospital: form.donorHospital,
          retrievalLocation: form.retrievalLocation,
          receiverHospital: form.receiverHospital,
          senderDistrict: form.senderDistrict,
          receiverDistrict: form.receiverDistrict,
        }),
      });
      setRegistered(organ);
      setRecentOrgans((prev) => [organ, ...prev].slice(0, 5));
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              <span className="title-gradient">Sender Dashboard</span>
            </h1>
            <p className="dashboard-subtitle">
              Register organs and initiate the transplant chain
            </p>
          </div>
          <div className="user-badge glass-panel">
            <span className="user-badge__icon">🏥</span>
            <div>
              <span className="user-badge__name">{user?.username}</span>
              <span className="user-badge__role">Sender Hospital</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <StatsCard icon="🫀" label="Organs Registered" value={recentOrgans.length} color="#0f766e" />
          <StatsCard icon="⛓️" label="On Blockchain" value={recentOrgans.length} color="#0f766e" />
          <StatsCard icon="🚑" label="In Transit" value="0" color="#0f766e" />
          <StatsCard icon="✅" label="Delivered" value="0" color="#0f766e" />
        </div>

        {/* Registration Form */}
        <div className="dashboard-grid">
          <section className="form-section glass-panel">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              Register New Organ
            </h2>
            <p className="section-desc">
              Registering creates the organ's record and anchors its fingerprint on
              the blockchain.
            </p>

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
                  <label>Organ Type</label>
                  <select name="organType" value={form.organType} onChange={update}>
                    <option>Kidney</option>
                    <option>Liver</option>
                    <option>Heart</option>
                    <option>Lung</option>
                    <option>Pancreas</option>
                  </select>
                </div>
              </div>

              {/* Sender Location */}
              <div className="location-section">
                <h3 className="location-title">
                  <span>📍</span> Sender Location (Tamil Nadu)
                </h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>District</label>
                    <select
                      name="senderDistrict"
                      value={form.senderDistrict}
                      onChange={update}
                      required
                    >
                      <option value="">Select district...</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Hospital</label>
                    <select
                      name="donorHospital"
                      value={form.donorHospital}
                      onChange={update}
                      required
                      disabled={!form.senderDistrict}
                    >
                      <option value="">
                        {form.senderDistrict
                          ? "Select hospital..."
                          : "Select district first"}
                      </option>
                      {senderHospitals.map((h) => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Receiver Location */}
              <div className="location-section">
                <h3 className="location-title">
                  <span>🏨</span> Receiver Location (Tamil Nadu)
                </h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>District</label>
                    <select
                      name="receiverDistrict"
                      value={form.receiverDistrict}
                      onChange={update}
                      required
                    >
                      <option value="">Select district...</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Hospital</label>
                    <select
                      name="receiverHospital"
                      value={form.receiverHospital}
                      onChange={update}
                      required
                      disabled={!form.receiverDistrict}
                    >
                      <option value="">
                        {form.receiverDistrict
                          ? "Select hospital..."
                          : "Select district first"}
                      </option>
                      {receiverHospitals.map((h) => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn glow-btn" disabled={loading}>
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <span>⛓️</span> Register on Blockchain
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="alert alert-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {registered && (
              <div className="alert alert-success">
                <h3>✅ {registered.organId} registered successfully!</h3>
                <div className="alert-details">
                  <div><strong>Type:</strong> {registered.organType}</div>
                  <div><strong>Block #:</strong> {registered.blockchain?.blockNumber}</div>
                  <div className="hash-row">
                    <strong>Tx:</strong>{" "}
                    <span className="hash">{registered.blockchain?.transactionHash}</span>
                  </div>
                  <div className="hash-row">
                    <strong>Fingerprint:</strong>{" "}
                    <span className="hash">{registered.hash}</span>
                  </div>
                </div>
                <Link
                  className="alert-action glow-btn"
                  to={`/custody?organId=${encodeURIComponent(registered.organId)}`}
                >
                  🚑 Initiate Transport
                </Link>
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="activity-section glass-panel">
            <h2 className="section-title">
              <span className="section-icon">📊</span>
              Recent Activity
            </h2>
            {recentOrgans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">🫀</div>
                <p>No organs registered yet</p>
                <p className="empty-state__hint">
                  Register your first organ to see activity here
                </p>
              </div>
            ) : (
              <ul className="activity-list">
                {recentOrgans.map((organ, i) => (
                  <li key={i} className="activity-item">
                    <div className="activity-item__icon">🫀</div>
                    <div className="activity-item__info">
                      <strong>{organ.organId}</strong>
                      <span>{organ.organType}</span>
                    </div>
                    <div className="activity-item__status">
                      <span className="status-badge status-registered">Registered</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
