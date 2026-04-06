// src/App.jsx
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";

export default function App() {
  const location = useLocation();

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
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link
            to="/"
            style={{
              color: location.pathname === "/" ? "#e62b1e" : "#aaa",
              textDecoration: "none",
              fontSize: "1rem",
              letterSpacing: "2px",
              borderBottom: location.pathname === "/" ? "2px solid #e62b1e" : "2px solid transparent",
              paddingBottom: "2px",
              transition: "all 0.2s",
            }}
          >
            DASHBOARD
          </Link>
          <Link
            to="/scanner"
            style={{
              color: location.pathname === "/scanner" ? "#e62b1e" : "#aaa",
              textDecoration: "none",
              fontSize: "1rem",
              letterSpacing: "2px",
              borderBottom: location.pathname === "/scanner" ? "2px solid #e62b1e" : "2px solid transparent",
              paddingBottom: "2px",
              transition: "all 0.2s",
            }}
          >
            SCANNER
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