"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── PALETTE DATA (mirrored from Python) ────────────────────────────────────

const LIP_SHADES = [
  { name: "Classic Red", color: [200, 0, 0] },
  { name: "Hot Pink", color: [255, 50, 180] },
  { name: "Nude Beige", color: [180, 130, 100] },
  { name: "Berry", color: [140, 30, 120] },
  { name: "Coral", color: [255, 130, 80] },
  { name: "Plum", color: [120, 20, 100] },
  { name: "Burgundy", color: [128, 0, 40] },
  { name: "Sepia Brown", color: [112, 66, 65] },
];

const BLUSH_SHADES = [
  { name: "Watermelon", color: [252, 108, 133] },
  { name: "Flamingo", color: [252, 200, 172] },
  { name: "Coral", color: [248, 131, 121] },
  { name: "Salmon", color: [255, 153, 153] },
  { name: "Pastel Pink", color: [255, 209, 220] },
  { name: "Bubblegum", color: [255, 193, 193] },
  { name: "Dark Pink", color: [231, 84, 128] },
  { name: "Bright Pink", color: [255, 0, 127] },
  { name: "Rouge", color: [148, 64, 100] },
  { name: "Neon Pink", color: [255, 110, 199] },
  { name: "Blush", color: [222, 93, 131] },
  { name: "Fuchsia", color: [193, 21, 193] },
];

const FOUNDATION_SHADES = [
  { name: "Porcelain", color: [230, 215, 215] },
  { name: "Ivory", color: [220, 210, 200] },
  { name: "Sand", color: [205, 190, 175] },
  { name: "Beige", color: [185, 170, 150] },
  { name: "Tan", color: [165, 140, 110] },
  { name: "Espresso", color: [120, 95, 70] },
];

const EYESHADOW_SHADES = [
  { name: "Soft Brown", color: [140, 80, 60] },
  { name: "Smoky Grey", color: [70, 60, 60] },
  { name: "Rose Gold", color: [200, 120, 100] },
  { name: "Purple Haze", color: [180, 50, 150] },
  { name: "Champagne", color: [200, 160, 120] },
  { name: "Forest Green", color: [50, 100, 40] },
];

// ─── MEDIAPIPE LANDMARK INDICES ─────────────────────────────────────────────

const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];
const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
const LID_LEFT = [246, 161, 160, 159, 158, 157, 173];
const LID_RIGHT = [466, 388, 387, 386, 385, 384, 398];
const BROW_LEFT = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const BROW_RIGHT = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const EYE_LEFT = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const EYE_RIGHT = [362, 398, 384, 385, 386, 387, 388, 466, 263];
const CHEEK_LEFT = [100, 119, 120, 121, 126, 116, 117, 118, 101, 123, 137, 93, 205, 138, 135];
const CHEEK_RIGHT = [266, 280, 340, 345, 346, 347, 348, 355, 329, 352, 328, 311, 411, 425, 426];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

// ─── CANVAS DRAW HELPERS ─────────────────────────────────────────────────────

function getLandmarkPts(landmarks, indices, w, h) {
  return indices.map(i => [landmarks[i].x * w, landmarks[i].y * h]);
}

function drawFeatheredPoly(ctx, pts, color, opacity, feather = 4) {
  if (!pts.length) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.shadowBlur = feather * 3;
  ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
  ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawRadialBlush(ctx, cx, cy, rx, ry, color, opacity) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${opacity})`);
  grad.addColorStop(0.5, `rgba(${color[0]},${color[1]},${color[2]},${opacity * 0.5})`);
  grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
  ctx.save();
  ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
  ctx.beginPath();
  ctx.arc(cx * (Math.max(rx, ry) / rx), cy * (Math.max(rx, ry) / ry), Math.max(rx, ry), 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function drawMakeup(ctx, landmarks, w, h, cfg) {
  ctx.clearRect(0, 0, w, h);

  // Foundation – subtle skin tone overlay
  if (cfg.showFoundation) {
    const fColor = FOUNDATION_SHADES[cfg.foundationIdx].color;
    const ovalPts = getLandmarkPts(landmarks, FACE_OVAL, w, h);
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    drawFeatheredPoly(ctx, ovalPts, fColor, cfg.foundationOp * 0.6, 12);
    ctx.restore();
  }

  // Eyeshadow
  if (cfg.showShadow) {
    const sColor = EYESHADOW_SHADES[cfg.shadowIdx].color;
    const op = cfg.shadowOp * cfg.globalOp;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const leftZone = [...getLandmarkPts(landmarks, LID_LEFT, w, h),
    ...getLandmarkPts(landmarks, BROW_LEFT, w, h)];
    const rightZone = [...getLandmarkPts(landmarks, LID_RIGHT, w, h),
    ...getLandmarkPts(landmarks, BROW_RIGHT, w, h)];
    drawFeatheredPoly(ctx, leftZone, sColor, op, 8);
    drawFeatheredPoly(ctx, rightZone, sColor, op, 8);
    ctx.restore();
  }

  // Blush
  if (cfg.showBlush) {
    const bColor = BLUSH_SHADES[cfg.blushIdx].color;
    const op = cfg.blushOp * cfg.globalOp;
    const leftPts = getLandmarkPts(landmarks, CHEEK_LEFT, w, h);
    const rightPts = getLandmarkPts(landmarks, CHEEK_RIGHT, w, h);
    const avg = (pts) => [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
    const faceWidth = Math.abs(
      landmarks[CHEEK_RIGHT[0]].x * w - landmarks[CHEEK_LEFT[0]].x * w
    );
    const [lcx, lcy] = avg(leftPts);
    const [rcx, rcy] = avg(rightPts);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    drawRadialBlush(ctx, lcx, lcy, faceWidth * 0.28, faceWidth * 0.18, bColor, op);
    drawRadialBlush(ctx, rcx, rcy, faceWidth * 0.28, faceWidth * 0.18, bColor, op);
    ctx.restore();
  }

  // Lipstick
  {
    const lColor = LIP_SHADES[cfg.lipIdx].color;
    const op = cfg.lipOp * cfg.globalOp;
    const lipPts = [
      ...getLandmarkPts(landmarks, LIPS_OUTER, w, h),
      ...getLandmarkPts(landmarks, LIPS_INNER, w, h),
    ];
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    drawFeatheredPoly(ctx, lipPts, lColor, op, 3);
    ctx.restore();
  }

  // Eyeliner
  if (cfg.showLiner) {
    const op = cfg.linerOp * cfg.globalOp;
    ctx.save();
    ctx.strokeStyle = `rgba(20,20,20,${op})`;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "source-over";
    for (const eyeIdx of [EYE_LEFT, EYE_RIGHT]) {
      const pts = getLandmarkPts(landmarks, eyeIdx, w, h);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ─── SWATCH COMPONENT ────────────────────────────────────────────────────────

function rgbToCss([r, g, b]) { return `rgb(${r},${g},${b})`; }

function SwatchGrid({ shades, selectedIdx, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0" }}>
      {shades.map((s, i) => (
        <button
          key={i}
          title={s.name}
          onClick={() => onSelect(i)}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: rgbToCss(s.color),
            border: i === selectedIdx
              ? "3px solid #F43F8A"
              : "2px solid rgba(244,63,138,0.15)",
            cursor: "pointer",
            outline: i === selectedIdx ? "2px solid rgba(244,63,138,0.4)" : "none",
            outlineOffset: 2,
            transform: i === selectedIdx ? "scale(1.15)" : "scale(1)",
            transition: "all 0.15s ease",
            boxShadow: i === selectedIdx
              ? `0 0 8px ${rgbToCss(s.color)}`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

function Section({ title, enabled, onToggle, children, desc }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      marginBottom: 10,
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px",
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
      }}>
        <span style={{ color: "#F43F8A", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1.5 }}>
          {title}
        </span>
        {onToggle !== undefined && (
          <button onClick={onToggle} style={{
            padding: "2px 10px", borderRadius: 4, border: "none",
            cursor: "pointer", fontSize: 11, fontWeight: 700,
            background: enabled ? "#27ae60" : "#c0392b",
            color: "#fff", letterSpacing: 0.5,
            transition: "background 0.2s",
          }}>
            {enabled ? "ON" : "OFF"}
          </button>
        )}
      </div>
      <div style={{ padding: "8px 14px 10px" }}>
        {children}
        {desc && <p style={{ margin: "6px 0 0", color: "#5C5470", fontSize: 11 }}>{desc}</p>}
      </div>
    </div>
  );
}

// ─── OPACITY SLIDER ──────────────────────────────────────────────────────────

function OpacitySlider({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ color: "#5C5470", fontSize: 11, width: 100, flexShrink: 0 }}>{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: "#F43F8A", cursor: "pointer" }}
      />
      <span style={{ color: "#F43F8A", fontSize: 11, width: 32, textAlign: "right" }}>{value.toFixed(2)}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ARTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const animRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediapipeLoaded, setMediapipeLoaded] = useState(false);

  // Makeup state
  const [foundationIdx, setFoundationIdx] = useState(2);
  const [lipIdx, setLipIdx] = useState(0);
  const [blushIdx, setBlushIdx] = useState(1);
  const [shadowIdx, setShadowIdx] = useState(0);
  const [showFoundation, setShowFoundation] = useState(false);
  const [showBlush, setShowBlush] = useState(true);
  const [showShadow, setShowShadow] = useState(true);
  const [showLiner, setShowLiner] = useState(true);
  const [foundationOp, setFoundationOp] = useState(0.35);
  const [lipOp, setLipOp] = useState(0.45);
  const [blushOp, setBlushOp] = useState(0.40);
  const [shadowOp, setShadowOp] = useState(0.32);
  const [linerOp, setLinerOp] = useState(0.80);
  const [globalOp, setGlobalOp] = useState(1.0);

  const cfgRef = useRef({});
  useEffect(() => {
    cfgRef.current = {
      foundationIdx, lipIdx, blushIdx, shadowIdx,
      showFoundation, showBlush, showShadow, showLiner,
      foundationOp, lipOp, blushOp, shadowOp, linerOp, globalOp,
    };
  }, [foundationIdx, lipIdx, blushIdx, shadowIdx,
    showFoundation, showBlush, showShadow, showLiner,
    foundationOp, lipOp, blushOp, shadowOp, linerOp, globalOp]);

  // Load MediaPipe scripts dynamically
  useEffect(() => {
    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
    ];
    let loaded = 0;
    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) { loaded++; if (loaded === scripts.length) setMediapipeLoaded(true); return; }
      const s = document.createElement("script");
      s.src = src; s.crossOrigin = "anonymous";
      s.onload = () => { loaded++; if (loaded === scripts.length) setMediapipeLoaded(true); };
      document.head.appendChild(s);
    });
    // Also load Rajdhani font
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap";
    document.head.appendChild(link);
  }, []);

  const startCamera = useCallback(async () => {
    if (!mediapipeLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const FaceMesh = window.FaceMesh;
      const Camera = window.Camera;
      if (!FaceMesh || !Camera) throw new Error("MediaPipe not loaded yet, please try again.");

      const fm = new FaceMesh({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      fm.onResults(results => {
        const video = videoRef.current;
        const overlay = overlayRef.current;
        if (!video || !overlay) return;
        const w = video.videoWidth || overlay.width;
        const h = video.videoHeight || overlay.height;
        overlay.width = w;
        overlay.height = h;
        const ctx = overlay.getContext("2d");
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          drawMakeup(ctx, results.multiFaceLandmarks[0], w, h, cfgRef.current);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
      });

      faceMeshRef.current = fm;

      const cam = new Camera(videoRef.current, {
        onFrame: async () => { await fm.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      cameraRef.current = cam;
      await cam.start();
      setCameraReady(true);
    } catch (e) {
      setError(e.message || "Camera error");
    } finally {
      setLoading(false);
    }
  }, [mediapipeLoaded]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) { cameraRef.current.stop(); cameraRef.current = null; }
    if (faceMeshRef.current) { faceMeshRef.current.close(); faceMeshRef.current = null; }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    const overlay = overlayRef.current;
    if (overlay) overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
    setCameraReady(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", gap: 16, width: "100%", height: "100%",
      background: "var(--background)",
      minHeight: "100vh", fontFamily: "'DM Sans', sans-serif",
      padding: 16, boxSizing: "border-box",
    }}>
      {/* ── LEFT: Camera Feed ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#ff6eb4,#ffd700)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>💄</div>
          <div>
            <h1 style={{ margin: 0, color: "#F43F8A", fontFamily: "'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
              AR MAKEUP STUDIO
            </h1>
            <p style={{ margin: 0, color: "#5C5470", fontSize: 11 }}>Virtual Try-On · Browser Edition</p>
          </div>
        </div>

        {/* Video container */}
        <div style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid rgba(244,63,138,0.15)",
          boxShadow: "0 4px 20px rgba(244,63,138,0.08)",
          aspectRatio: "4/3", width: "100%",
        }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}
          />
          <canvas ref={overlayRef}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%",
              pointerEvents: "none", transform: "scaleX(-1)",
            }}
          />
          {/* Placeholder when not started */}
          {!cameraReady && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(255,245,247,0.92)", gap: 14,
            }}>
              <div style={{ fontSize: 56, filter: "drop-shadow(0 0 20px rgba(244,63,138,0.5))" }}>💄</div>
              <p style={{ color: "#5C5470", margin: 0, fontSize: 14, textAlign: "center", padding: "0 24px" }}>
                Your browser will ask for camera access.<br />Makeup is applied entirely in-browser.
              </p>
              {error && <p style={{ color: "#ff6b6b", margin: 0, fontSize: 12, textAlign: "center", maxWidth: 280 }}>{error}</p>}
              <button onClick={startCamera} disabled={loading || !mediapipeLoaded}
                style={{
                  padding: "12px 32px", borderRadius: 50,
                  background: loading || !mediapipeLoaded
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(135deg,#ff6eb4,#ffd700)",
                  border: "none", color: "#fff", fontSize: 15,
                  fontWeight: 700, cursor: loading || !mediapipeLoaded ? "not-allowed" : "pointer",
                  fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1.5,
                  boxShadow: loading ? "none" : "0 4px 24px rgba(255,110,180,0.4)",
                  transition: "all 0.2s",
                }}>
                {!mediapipeLoaded ? "⏳ Loading MediaPipe…" : loading ? "⏳ Starting camera…" : "✨ Launch AR Camera"}
              </button>
            </div>
          )}
          {/* Stop button overlay */}
          {cameraReady && (
            <button onClick={stopCamera}
              style={{
                position: "absolute", top: 10, right: 10,
                padding: "4px 12px", borderRadius: 20,
                background: "rgba(192,57,43,0.85)", border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", backdropFilter: "blur(4px)",
              }}>
              ✕ Stop
            </button>
          )}
        </div>

        {/* Quick opacity row */}
        {cameraReady && (
          <div style={{
            background: "#FFFFFF", borderRadius: 10,
            border: "1px solid #E5E7EB",
            padding: "10px 14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}>
            <p style={{ margin: "0 0 8px", color: "#F43F8A", fontSize: 12, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 1 }}>GLOBAL OPACITY</p>
            <OpacitySlider label="Master" value={globalOp} onChange={setGlobalOp} />
          </div>
        )}
      </div>

      {/* ── RIGHT: Controls Panel ── */}
      <div style={{
        width: 300, flexShrink: 0, overflowY: "auto", paddingRight: 2,
        maxHeight: "100vh",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(244,63,138,0.3) transparent",
      }}>

        {/* Foundation */}
        <Section title="FOUNDATION" enabled={showFoundation} onToggle={() => setShowFoundation(v => !v)} desc="Smooths skin · corrects tone">
          <SwatchGrid shades={FOUNDATION_SHADES} selectedIdx={foundationIdx} onSelect={i => { setFoundationIdx(i); setShowFoundation(true); }} />
          <p style={{ margin: "4px 0 6px", color: "#1C1120", fontSize: 12, fontWeight: 500 }}>{FOUNDATION_SHADES[foundationIdx].name}</p>
          <OpacitySlider label="Intensity" value={foundationOp} onChange={setFoundationOp} />
        </Section>

        {/* Lipstick */}
        <Section title="LIPSTICK" desc="Overlay blend · colour shows through">
          <SwatchGrid shades={LIP_SHADES} selectedIdx={lipIdx} onSelect={setLipIdx} />
          <p style={{ margin: "4px 0 6px", color: "#1C1120", fontSize: 12, fontWeight: 500 }}>{LIP_SHADES[lipIdx].name}</p>
          <OpacitySlider label="Intensity" value={lipOp} onChange={setLipOp} />
        </Section>

        {/* Blush */}
        <Section title="BLUSH" enabled={showBlush} onToggle={() => setShowBlush(v => !v)} desc="Soft-light · follows cheekbones">
          <SwatchGrid shades={BLUSH_SHADES} selectedIdx={blushIdx} onSelect={setBlushIdx} />
          <p style={{ margin: "4px 0 6px", color: "#1C1120", fontSize: 12, fontWeight: 500 }}>{BLUSH_SHADES[blushIdx].name}</p>
          <OpacitySlider label="Depth" value={blushOp} onChange={setBlushOp} />
        </Section>

        {/* Eyeshadow */}
        <Section title="EYESHADOW" enabled={showShadow} onToggle={() => setShowShadow(v => !v)} desc="Gradient from lid up to brow">
          <SwatchGrid shades={EYESHADOW_SHADES} selectedIdx={shadowIdx} onSelect={setShadowIdx} />
          <p style={{ margin: "4px 0 6px", color: "#1C1120", fontSize: 12, fontWeight: 500 }}>{EYESHADOW_SHADES[shadowIdx].name}</p>
          <OpacitySlider label="Depth" value={shadowOp} onChange={setShadowOp} />
        </Section>

        {/* Eyeliner */}
        <Section title="EYELINER" enabled={showLiner} onToggle={() => setShowLiner(v => !v)} desc="Classic polylines · follows upper lash line">
          <OpacitySlider label="Ink opacity" value={linerOp} onChange={setLinerOp} />
        </Section>

        {/* Fine-tune opacities */}
        <Section title="FINE TUNE OPACITY">
          <OpacitySlider label="Foundation" value={foundationOp} onChange={setFoundationOp} />
          <OpacitySlider label="Lipstick" value={lipOp} onChange={setLipOp} />
          <OpacitySlider label="Blush" value={blushOp} onChange={setBlushOp} />
          <OpacitySlider label="Eyeshadow" value={shadowOp} onChange={setShadowOp} />
          <OpacitySlider label="Eyeliner" value={linerOp} onChange={setLinerOp} />
        </Section>

        <p style={{ color: "#5C5470", fontSize: 10, textAlign: "center", padding: "4px 0 16px" }}>
          All processing is done locally in your browser
        </p>
      </div>
    </div>
  );
}
