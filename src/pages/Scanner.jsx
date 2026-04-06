// src/pages/Scanner.jsx
import { useEffect, useRef, useState } from "react";
import { rtdb } from "../firebase";
import { ref, runTransaction, push } from "firebase/database";
import { Html5Qrcode } from "html5-qrcode";

const SCAN_COOLDOWN_MS = 2500; // prevent double-scans

export default function Scanner() {
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [lastCount, setLastCount] = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const scannerRef = useRef(null);
  const lastScanTime = useRef(0);
  const processingRef = useRef(false);

  const handleScan = async (decodedText) => {
    const now = Date.now();
    if (processingRef.current || now - lastScanTime.current < SCAN_COOLDOWN_MS) return;

    processingRef.current = true;
    lastScanTime.current = now;

    try {
      // Increment attendance count atomically
      let newCount = null;
      await runTransaction(ref(rtdb, "attendance/count"), (current) => {
        newCount = (current || 0) + 1;
        return newCount;
      });

      // Log the scan
      await push(ref(rtdb, "scans"), {
        timestamp: Date.now(),
        number: newCount,
        qrData: decodedText.substring(0, 40), // store partial for reference
      });

      setLastCount(newCount);
      setStatus("success");
      setScanLog((prev) => [
        { time: new Date().toLocaleTimeString(), number: newCount },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }

    setTimeout(() => {
      setStatus("idle");
      processingRef.current = false;
    }, SCAN_COOLDOWN_MS);
  };

  const startScanner = async () => {
    if (scannerRef.current) return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) throw new Error("No camera found");

      // Prefer back camera
      const backCam = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];

      await scanner.start(
        backCam.id,
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        handleScan,
        () => {}
      );

      setIsRunning(true);
      setCameraError(null);
    } catch (err) {
      console.error(err);
      setCameraError(err.message || "Camera access denied. Please allow camera permissions.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
      setIsRunning(false);
      setStatus("idle");
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const statusConfig = {
    idle: { color: "#333", bg: "#111", text: "READY TO SCAN", border: "#333" },
    success: { color: "#00e676", bg: "#001a0d", text: `✓ CHECKED IN  #${String(lastCount).padStart(3, "0")}`, border: "#00e676" },
    error: { color: "#e62b1e", bg: "#1a0000", text: "✗ SCAN FAILED", border: "#e62b1e" },
  };

  const s = statusConfig[status];

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "2rem 1rem",
      gap: "1.5rem",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        #qr-reader { background: transparent !important; border: none !important; }
        #qr-reader video { border-radius: 12px; }
        #qr-reader__scan_region { background: transparent !important; }
        #qr-reader__dashboard { display: none !important; }

        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes successPop {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>

      <p style={{
        color: "#e62b1e",
        fontSize: "1.1rem",
        letterSpacing: "0.4em",
        fontFamily: "'Bebas Neue', sans-serif",
        margin: 0,
      }}>
        WELCOME DESK — SCANNER
      </p>

      {/* Camera viewport */}
      <div style={{
        position: "relative",
        width: "min(90vw, 360px)",
        borderRadius: "16px",
        overflow: "hidden",
        border: `2px solid ${s.border}`,
        background: "#111",
        boxShadow: status === "success"
          ? "0 0 40px #00e67644"
          : status === "error"
          ? "0 0 40px #e62b1e44"
          : "0 0 20px #00000088",
        transition: "border-color 0.3s, box-shadow 0.3s",
        animation: status === "success" ? "successPop 0.3s ease" : "none",
      }}>
        <div id="qr-reader" style={{ width: "100%", minHeight: "300px" }} />

        {/* Scan guide corners */}
        {["topleft", "topright", "bottomleft", "bottomright"].map((pos) => (
          <div key={pos} style={{
            position: "absolute",
            width: "24px",
            height: "24px",
            borderColor: s.border === "#333" ? "#e62b1e" : s.border,
            borderStyle: "solid",
            borderWidth: 0,
            ...(pos.includes("top") ? { top: "20px", borderTopWidth: "3px" } : { bottom: "20px", borderBottomWidth: "3px" }),
            ...(pos.includes("left") ? { left: "20px", borderLeftWidth: "3px" } : { right: "20px", borderRightWidth: "3px" }),
            transition: "border-color 0.3s",
            borderRadius: "2px",
          }} />
        ))}

        {/* Scan animation line */}
        {isRunning && status === "idle" && (
          <div style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #e62b1e, transparent)",
            animation: "scanLine 2s linear infinite",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <div style={{
          background: "#1a0000",
          border: "1px solid #e62b1e",
          borderRadius: "10px",
          padding: "1rem 1.5rem",
          color: "#e62b1e",
          fontFamily: "monospace",
          fontSize: "0.85rem",
          maxWidth: "360px",
          textAlign: "center",
        }}>
          ⚠ {cameraError}
        </div>
      )}

      {/* Status badge */}
      <div style={{
        padding: "0.8rem 2rem",
        borderRadius: "8px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "1.4rem",
        letterSpacing: "0.15em",
        minWidth: "260px",
        textAlign: "center",
        transition: "all 0.3s ease",
      }}>
        {s.text}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "1rem" }}>
        {!isRunning ? (
          <button onClick={startScanner} style={{
            background: "#e62b1e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.7rem 1.8rem",
            fontSize: "1rem",
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: "0.15em",
            cursor: "pointer",
          }}>
            START CAMERA
          </button>
        ) : (
          <button onClick={stopScanner} style={{
            background: "transparent",
            color: "#555",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "0.7rem 1.8rem",
            fontSize: "1rem",
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: "0.15em",
            cursor: "pointer",
          }}>
            STOP
          </button>
        )}
      </div>

      {/* Scan log */}
      {scanLog.length > 0 && (
        <div style={{
          width: "min(90vw, 360px)",
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "0.6rem 1.25rem",
            borderBottom: "1px solid #1e1e1e",
            color: "#555",
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            fontFamily: "'Bebas Neue', sans-serif",
          }}>
            THIS SESSION
          </div>
          {scanLog.map((entry, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.55rem 1.25rem",
              borderBottom: i < scanLog.length - 1 ? "1px solid #161616" : "none",
              background: i === 0 ? "#001a0d" : "transparent",
            }}>
              <span style={{ color: i === 0 ? "#00e676" : "#444", fontFamily: "monospace", fontSize: "0.8rem" }}>
                ✓ Attendee #{String(entry.number).padStart(3, "0")}
              </span>
              <span style={{ color: "#333", fontFamily: "monospace", fontSize: "0.75rem" }}>
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}