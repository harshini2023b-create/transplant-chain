import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const EMPTY = {
  organId: "",
  organType: "Kidney",
  donorHospital: "",
  retrievalLocation: "",
};

export default function HospitalDashboard() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(null);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
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
          ...form,
          organId: form.organId.trim(),
        }),
      });
      setRegistered(organ);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Register an organ</h1>
      <p className="lead">
        Registering creates the organ's record and anchors its fingerprint on
        the blockchain.
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
          Organ type
          <select name="organType" value={form.organType} onChange={update}>
            <option>Kidney</option>
            <option>Liver</option>
            <option>Heart</option>
            <option>Lung</option>
            <option>Pancreas</option>
          </select>
        </label>

        <label>
          Donor hospital
          <input
            name="donorHospital"
            value={form.donorHospital}
            onChange={update}
            required
          />
        </label>

        <label>
          Retrieval location
          <input
            name="retrievalLocation"
            value={form.retrievalLocation}
            onChange={update}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Registering…" : "Register organ"}
        </button>
      </form>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      {registered && (
        <section className="notice success" aria-live="polite">
          <h2>{registered.organId} registered</h2>
          <dl className="facts">
            <dt>Type</dt>
            <dd>{registered.organType}</dd>
            <dt>Blockchain block</dt>
            <dd>{registered.blockchain?.blockNumber}</dd>
            <dt>Transaction</dt>
            <dd className="hash">{registered.blockchain?.transactionHash}</dd>
            <dt>Fingerprint</dt>
            <dd className="hash">{registered.hash}</dd>
          </dl>
          <Link
            className="button secondary"
            to={`/custody?organId=${encodeURIComponent(registered.organId)}`}
          >
            Record first custody event
          </Link>
        </section>
      )}
    </div>
  );
}
