import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  TAMIL_NADU_DISTRICTS,
  HOSPITALS_BY_DISTRICT,
} from "../data/tamilnaduHospitals";

export default function ReceiverDashboard() {
  const { user } = useAuth();
  const [organId, setOrganId] = useState("");
  const [organData, setOrganData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmForm, setConfirmForm] = useState({
    district: "",
    hospital: "",
    status: "Received",
  });
  const [confirmed, setConfirmed] = useState(null);
  const [receivedOrgans, setReceivedOrgans] = useState([]);

  const hospitals = useMemo(
    () => (confirmForm.district ? HOSPITALS_BY_DISTRICT[confirmForm.district] || [] : []),
    [confirmForm.district]
  );

  async function lookupOrgan(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrganData(null);
    setConfirmed(null);
    try {
      const data = await api(`/api/audit/${encodeURIComponent(organId.trim())}`);
      setOrganData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmReceipt(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api("/api/custody/events", {
        method: "POST",
        body: JSON.stringify({
          organId: organId.trim(),
          location: `${confirmForm.hospital}, ${confirmForm.district}`,
          custodian: user?.username || "Receiver",
          status: confirmForm.status,
        }),
      });
      setConfirmed(result);
      setReceivedOrgans((prev) => [{ ...result, organId: organId.trim() }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const lastEvent = organData?.custodyHistory?.[organData.custodyHistory.length - 1];

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              <span className="title-gradient">Receiver Dashboard</span>
            </h1>
            <p className="dashboard-subtitle">
              Verify and confirm organ receipt at your hospital
            </p>
          </div>
          <div className="user-badge glass-panel">
            <span className="user-badge__icon">🏨</span>
            <div>
              <span className="user-badge__name">{user?.username}</span>
              <span className="user-badge__role">Receiver Hospital</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stats-card glass-panel" style={{ "--card-accent": "#0f766e" }}>
            <div className="stats-card__icon">📦</div>
            <div className="stats-card__data">
              <span className="stats-card__value">{receivedOrgans.length}</span>
              <span className="stats-card__label">Received</span>
            </div>
          </div>
          <div className="stats-card glass-panel" style={{ "--card-accent": "#0f766e" }}>
            <div className="stats-card__icon">✅</div>
            <div className="stats-card__data">
              <span className="stats-card__value">
                {receivedOrgans.filter((o) => o.status === "Delivered").length}
              </span>
              <span className="stats-card__label">Verified</span>
            </div>
          </div>
          <div className="stats-card glass-panel" style={{ "--card-accent": "#0f766e" }}>
            <div className="stats-card__icon">⏳</div>
            <div className="stats-card__data">
              <span className="stats-card__value">
                {receivedOrgans.filter((o) => o.status === "Received").length}
              </span>
              <span className="stats-card__label">Pending Verify</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Organ Lookup */}
          <section className="form-section glass-panel">
            <h2 className="section-title">
              <span className="section-icon">🔎</span>
              Lookup Incoming Organ
            </h2>
            <p className="section-desc">
              Enter the organ ID to verify its chain-of-custody before confirming receipt.
            </p>

            <form onSubmit={lookupOrgan} className="modern-form">
              <div className="form-row">
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Organ ID</label>
                  <input
                    value={organId}
                    onChange={(e) => setOrganId(e.target.value)}
                    placeholder="KIDNEY-001"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="submit-btn glow-btn"
                  disabled={loading}
                  style={{ alignSelf: "flex-end" }}
                >
                  {loading ? <span className="spinner" /> : "🔍 Lookup"}
                </button>
              </div>
            </form>

            {error && (
              <div className="alert alert-error"><span>⚠️</span> {error}</div>
            )}

            {organData && (
              <div className="organ-info-card glass-panel" style={{ marginTop: "1.5rem" }}>
                <h3>🫀 {organData.organId}</h3>
                <div className="organ-info-grid">
                  <div><strong>Type:</strong> {organData.organType}</div>
                  <div><strong>Donor Hospital:</strong> {organData.donorHospital}</div>
                  <div><strong>Chain Events:</strong> {organData.custodyHistory?.length || 0}</div>
                  {lastEvent && (
                    <>
                      <div><strong>Last Status:</strong> {lastEvent.status}</div>
                      <div><strong>Last Location:</strong> {lastEvent.location}</div>
                      <div><strong>Last Custodian:</strong> {lastEvent.custodian}</div>
                    </>
                  )}
                  <div>
                    <strong>Blockchain:</strong>{" "}
                    <span className={organData.blockchain?.valid !== false ? "text-green" : "text-red"}>
                      {organData.blockchain?.valid !== false ? "✅ Verified" : "❌ Not Verified"}
                    </span>
                  </div>
                </div>

                {/* Confirm Receipt Form */}
                <div className="confirm-section">
                  <h4>Confirm Receipt at Your Hospital</h4>
                  <form onSubmit={confirmReceipt} className="modern-form">
                    <div className="form-row">
                      <div className="input-group">
                        <label>District</label>
                        <select
                          value={confirmForm.district}
                          onChange={(e) =>
                            setConfirmForm((prev) => ({ ...prev, district: e.target.value, hospital: "" }))
                          }
                          required
                        >
                          <option value="">Select...</option>
                          {TAMIL_NADU_DISTRICTS.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Hospital</label>
                        <select
                          value={confirmForm.hospital}
                          onChange={(e) =>
                            setConfirmForm((prev) => ({ ...prev, hospital: e.target.value }))
                          }
                          required
                          disabled={!confirmForm.district}
                        >
                          <option value="">
                            {confirmForm.district ? "Select..." : "Select district first"}
                          </option>
                          {hospitals.map((h) => (
                            <option key={h.name}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Status</label>
                      <select
                        value={confirmForm.status}
                        onChange={(e) =>
                          setConfirmForm((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        <option>Received</option>
                        <option>Delivered</option>
                      </select>
                    </div>
                    <button type="submit" className="submit-btn glow-btn" disabled={loading}>
                      {loading ? <span className="spinner" /> : "✅ Confirm Receipt"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="alert alert-success">
                <h3>✅ Receipt confirmed on blockchain!</h3>
                <div className="alert-details">
                  <div><strong>Status:</strong> {confirmed.status}</div>
                  <div><strong>Location:</strong> {confirmed.location}</div>
                  <div><strong>Block #:</strong> {confirmed.blockchain?.blockNumber}</div>
                </div>
                <Link className="alert-action glow-btn" to={`/history/${encodeURIComponent(organId.trim())}`}>
                  📊 View Full History
                </Link>
              </div>
            )}
          </section>

          {/* Recent Receipts */}
          <section className="activity-section glass-panel">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              Recent Receipts
            </h2>
            {receivedOrgans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📦</div>
                <p>No organs received yet</p>
                <p className="empty-state__hint">
                  Look up an organ ID to verify and confirm receipt
                </p>
              </div>
            ) : (
              <ul className="activity-list">
                {receivedOrgans.map((organ, i) => (
                  <li key={i} className="activity-item">
                    <div className="activity-item__icon">🫀</div>
                    <div className="activity-item__info">
                      <strong>{organ.organId}</strong>
                      <span>{organ.location}</span>
                    </div>
                    <div className="activity-item__status">
                      <span className={`status-badge status-${organ.status?.toLowerCase()}`}>
                        {organ.status}
                      </span>
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
