import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../auth";

const NAV = [
  { to: "/", label: "Overview", end: true },
  { to: "/users", label: "Users" },
  { to: "/transactions", label: "Transactions" },
  { to: "/support", label: "Support" },
  { to: "/instruments", label: "Instruments" },
  { to: "/audit", label: "Audit trail" },
];

const TITLES = [
  ["/users/", "User management"],
  ["/transactions", "Transactions"],
  ["/support", "Support conversations"],
  ["/instruments", "Instruments"],
  ["/audit", "Audit trail"],
  ["/", "Overview"],
];

function pageTitle(pathname) {
  for (const [prefix, title] of TITLES) {
    if (prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)) return title;
  }
  return "Dashboard";
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSessionUser();

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-brand">
          Veltrix<span> Admin</span>
        </div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer" title={user?.email || ""}>
          {user?.email || "Signed in"}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
              &#9776;
            </button>
            <h1>{pageTitle(location.pathname)}</h1>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Sign out
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
