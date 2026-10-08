import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const roleData = ROLES[user?.role];

  // Role-specific nav links
  const navItems = {
    sender: [
      { to: "/sender", label: "Dashboard", icon: "🏥" },
      { to: "/custody", label: "Transport", icon: "🚑" },
    ],
    transporter: [
      { to: "/transporter", label: "Transport", icon: "🚑" },
    ],
    receiver: [
      { to: "/receiver", label: "Dashboard", icon: "🏨" },
    ],
    auditor: [
      { to: "/audit", label: "Audit Trail", icon: "🔍" },
    ],
  };

  const items = navItems[user?.role] || [];

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <span className="navbar__logo">⛓️</span>
          <span className="navbar__wordmark">TransplantChain</span>
        </div>

        <nav className="navbar__links">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className="navbar__link">
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__user">
          <div
            className="navbar__role-badge"
            style={{ background: roleData?.gradient || "#333" }}
          >
            <span>{roleData?.icon}</span>
            <span>{roleData?.label}</span>
          </div>
          <button className="navbar__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
