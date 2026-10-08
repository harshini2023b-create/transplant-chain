import { useState } from "react";
import { ROLES, useAuth } from "../context/AuthContext";

function RoleCard({ roleKey, onSelect }) {
  const role = ROLES[roleKey];

  return (
    <button
      type="button"
      className="role-card"
      onClick={() => onSelect(roleKey)}
      aria-label={`Sign in as ${role.label}`}
    >
      <span className="role-card__icon" aria-hidden="true">{role.icon}</span>
      <span className="role-card__content">
        <strong>{role.label}</strong>
        <span>{role.description}</span>
      </span>
      <span className="role-card__arrow" aria-hidden="true">→</span>
    </button>
  );
}

function LoginForm({ role, onBack }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const roleData = ROLES[role];

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 350));
    const result = login(role, username, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  }

  return (
    <main className="login-page login-page--form">
      <section className="login-form-panel" aria-labelledby="login-heading">
        <button type="button" className="back-btn" onClick={onBack}>← All roles</button>
        <div className="login-form-header">
          <span className="login-form-icon" aria-hidden="true">{roleData.icon}</span>
          <p className="eyebrow">Secure workspace</p>
          <h1 id="login-heading">Sign in to {roleData.label}</h1>
          <p className="login-form-desc">{roleData.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={`Enter ${role} username`}
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? <span className="spinner" aria-label="Signing in" /> : "Sign in"}
          </button>
          <p className="demo-hint">
            Demo account: <code>{role}@hospital.tn</code> / <code>{role}123</code>
            {role === "transporter" && <><br />Use <code>transporter@chain.tn</code> / <code>transport123</code></>}
            {role === "auditor" && <><br />Use <code>auditor@transplant.tn</code> / <code>auditor123</code></>}
          </p>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  if (selectedRole) return <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} />;

  return (
    <main className="login-page">
      <section className="login-content" aria-labelledby="welcome-heading">
        <div className="login-hero">
          <p className="eyebrow">Organ chain-of-custody</p>
          <h1 id="welcome-heading" className="login-title">TransplantChain</h1>
          <p className="login-subtitle">
            A secure, traceable workspace for the transplant journey.
          </p>
        </div>
        <div className="role-grid" aria-label="Choose your workspace">
          {Object.keys(ROLES).map((roleKey) => (
            <RoleCard key={roleKey} roleKey={roleKey} onSelect={setSelectedRole} />
          ))}
        </div>
        <p className="login-instruction">Select the workspace that matches your role.</p>
      </section>
    </main>
  );
}
