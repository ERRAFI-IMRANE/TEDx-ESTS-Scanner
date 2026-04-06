// src/App.jsx
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";

export default function App() {
  const location = useLocation();

  const linkStyle = (path) => ({
    textDecoration: "none",
    color: location.pathname === path ? "#0a0a0a" : "#fff",
    background: location.pathname === path ? "#e62b1e" : "transparent",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "2px solid #e62b1e",
    fontWeight: "bold",
    transition: "0.3s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}>
      
      {/* Nav */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: "60px",
        background: "#111",
        borderBottom: "2px solid #e62b1e",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ color: "#fff", fontSize: "20px" }}>
          AXA App
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/" style={linkStyle("/")}>
            Dashboard
          </Link>
          <Link to="/scanner" style={linkStyle("/scanner")}>
            Scanner
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scanner" element={<Scanner />} />
      </Routes>
    </div>
  );
}