// src/pages/Scanner.jsx
import { useEffect, useRef, useState } from "react";
import { rtdb } from "../firebase";
import { ref, runTransaction } from "firebase/database";

export default function Scanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cooldownRef = useRef(false);

  const [isRunning, setIsRunning] = useState(false);
  const [count, setCount] = useState(null);
  const [status, setStatus] = useState("idle");
  const [cameraError, setCameraError] = useState(null);

  // 🎥 Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsRunning(true);
      setCameraError(null);
    } catch (err) {
      setCameraError("Camera access denied or not available.");
    }
  };

  // 🛑 Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRunning(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // ➕ Increment attendance
  const handleClick = async () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    try {
      let newCount = null;

      await runTransaction(ref(rtdb, "attendance/count"), (current) => {
        newCount = (current || 0) + 1;
        return newCount;
      });

      setCount(newCount);
      setStatus("success");
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setStatus("idle");
      cooldownRef.current = false;
    }, 1500);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>WELCOME DESK — CAMERA</h2>

      {/* Camera */}
      <div
        style={{
          width: "300px",
          height: "300px",
          margin: "auto",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Error */}
      {cameraError && <p style={{ color: "red" }}>{cameraError}</p>}

      {/* Button */}
      <button
        onClick={handleClick}
        disabled={!isRunning}
        style={{
          marginTop: "20px",
          padding: "12px 30px",
          fontSize: "18px",
          background: status === "success" ? "green" : "#e62b1e",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        {status === "success"
          ? `✓ COUNT: ${count}`
          : "CLICK TO CHECK IN"}
      </button>

      {/* Controls */}
      <div style={{ marginTop: "15px" }}>
        {!isRunning ? (
          <button onClick={startCamera}>START CAMERA</button>
        ) : (
          <button onClick={stopCamera}>STOP CAMERA</button>
        )}
      </div>
    </div>
  );
}