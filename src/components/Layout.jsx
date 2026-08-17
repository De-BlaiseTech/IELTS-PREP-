import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Headphones, Home, LogOut, Menu, Mic2, PenLine, PlayCircle, UserRound, X } from "lucide-react";
import { logout } from "../services/auth";
import { useApp } from "../context/AppContext";

export default function Layout({ children }) {
  const [open, setOpen] = React.useState(false);
  const { user } = useApp();
  const navigate = useNavigate();

  const links = [
    ["/dashboard", "Dashboard", Home],
    ["/practice", "Practice", PlayCircle],
    ["/mock-tests", "Mock Tests", BookOpen],
    ["/listening", "Listening", Headphones],
    ["/reading", "Reading", BookOpen],
    ["/writing", "Writing", PenLine],
    ["/speaking", "Speaking", Mic2],
    ["/progress", "Progress", BarChart3],
    ["/profile", "Profile", UserRound]
  ];

  async function signOut() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">I</div>
          <div><strong>IELTS Prep</strong><span>CBT Practice</span></div>
          <button className="icon-btn mobile-only" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Icon size={19}/><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={signOut}><LogOut size={19}/><span>Sign out</span></button>
        </div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu size={22}/></button>
          <div className="topbar-title">IELTS Practice Centre</div>
          <div className="avatar">{(user?.displayName || user?.email || "S").slice(0,1).toUpperCase()}</div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
