// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";

// // ─── LANDMARK INDICES (exact from user) ──────────────────────────────────────
// const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];
// const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
// const EYE_LEFT = [33, 246, 161, 160, 159, 158, 157, 173, 133];
// const EYE_RIGHT = [362, 398, 384, 385, 386, 387, 388, 466, 263];
// const LID_LEFT = [246, 161, 160, 159, 158, 157, 173];
// const LID_RIGHT = [466, 388, 387, 386, 385, 384, 398];
// const BROW_LEFT = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
// const BROW_RIGHT = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
// const CHEEK_LEFT = [100, 119, 120, 121, 126, 116, 117, 118, 101, 123, 137, 93, 205, 138, 135];
// const CHEEK_RIGHT = [266, 280, 340, 345, 346, 347, 348, 355, 329, 352, 328, 311, 411, 425, 426];
// const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

// // ─── PALETTE DATA ─────────────────────────────────────────────────────────────
// const LIP_SHADES = [
//   { name: "Classic Red", color: [200, 0, 0] },
//   { name: "Hot Pink", color: [255, 50, 180] },
//   { name: "Nude Beige", color: [180, 130, 100] },
//   { name: "Berry", color: [140, 30, 120] },
//   { name: "Coral", color: [255, 130, 80] },
//   { name: "Plum", color: [120, 20, 100] },
//   { name: "Burgundy", color: [128, 0, 40] },
//   { name: "Sepia Brown", color: [112, 66, 65] },
// ];
// const BLUSH_SHADES = [
//   { name: "Watermelon", color: [252, 108, 133] },
//   { name: "Flamingo", color: [252, 200, 172] },
//   { name: "Coral", color: [248, 131, 121] },
//   { name: "Salmon", color: [255, 153, 153] },
//   { name: "Pastel Pink", color: [255, 209, 220] },
//   { name: "Bubblegum", color: [255, 193, 193] },
//   { name: "Dark Pink", color: [231, 84, 128] },
//   { name: "Bright Pink", color: [255, 0, 127] },
//   { name: "Rouge", color: [148, 64, 100] },
//   { name: "Neon Pink", color: [255, 110, 199] },
//   { name: "Blush", color: [222, 93, 131] },
//   { name: "Fuchsia", color: [193, 21, 193] },
// ];
// const FOUNDATION_SHADES = [
//   { name: "Porcelain", color: [230, 215, 215] },
//   { name: "Ivory", color: [220, 210, 200] },
//   { name: "Sand", color: [205, 190, 175] },
//   { name: "Beige", color: [185, 170, 150] },
//   { name: "Tan", color: [165, 140, 110] },
//   { name: "Espresso", color: [120, 95, 70] },
// ];
// const EYESHADOW_SHADES = [
//   { name: "Soft Brown", color: [140, 80, 60] },
//   { name: "Smoky Grey", color: [70, 60, 60] },
//   { name: "Rose Gold", color: [200, 120, 100] },
//   { name: "Purple Haze", color: [180, 50, 150] },
//   { name: "Champagne", color: [200, 160, 120] },
//   { name: "Forest Green", color: [50, 100, 40] },
// ];

// // ─── CANVAS HELPERS ───────────────────────────────────────────────────────────
// function getPts(lm, indices, w, h) {
//   return indices.map(i => [lm[i].x * w, lm[i].y * h]);
// }

// function featheredPoly(ctx, pts, color, opacity, blur = 4) {
//   if (!pts.length) return;
//   ctx.save();
//   ctx.shadowBlur = blur * 3;
//   ctx.shadowColor = `rgba(${color},${opacity})`;
//   ctx.fillStyle = `rgba(${color},${opacity})`;
//   ctx.beginPath();
//   ctx.moveTo(pts[0][0], pts[0][1]);
//   for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
//   ctx.closePath();
//   ctx.fill();
//   ctx.restore();
// }

// function radialBlush(ctx, cx, cy, rx, ry, color, op) {
//   const r = Math.max(rx, ry);
//   const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
//   g.addColorStop(0, `rgba(${color},${op})`);
//   g.addColorStop(0.5, `rgba(${color},${op * 0.5})`);
//   g.addColorStop(1, `rgba(${color},0)`);
//   ctx.save();
//   ctx.scale(rx / r, ry / r);
//   ctx.beginPath();
//   ctx.arc(cx * (r / rx), cy * (r / ry), r, 0, Math.PI * 2);
//   ctx.fillStyle = g;
//   ctx.fill();
//   ctx.restore();
// }

// function avg(pts) {
//   return [
//     pts.reduce((s, p) => s + p[0], 0) / pts.length,
//     pts.reduce((s, p) => s + p[1], 0) / pts.length
//   ];
// }

// function drawMakeup(ctx, lm, w, h, cfg) {
//   ctx.clearRect(0, 0, w, h);

//   // Foundation — soft-light over face oval
//   if (cfg.showFoundation) {
//     const c = FOUNDATION_SHADES[cfg.foundationIdx].color.join(",");
//     ctx.save();
//     ctx.globalCompositeOperation = "soft-light";
//     featheredPoly(ctx, getPts(lm, FACE_OVAL, w, h), c, cfg.foundationOp * 0.6, 12);
//     ctx.restore();
//   }

//   // Eyeshadow — multiply from lid up to brow
//   if (cfg.showShadow) {
//     const c = EYESHADOW_SHADES[cfg.shadowIdx].color.join(",");
//     const op = cfg.shadowOp * cfg.globalOp;
//     ctx.save();
//     ctx.globalCompositeOperation = "multiply";
//     featheredPoly(ctx, [...getPts(lm, LID_LEFT, w, h), ...getPts(lm, BROW_LEFT, w, h)], c, op, 8);
//     featheredPoly(ctx, [...getPts(lm, LID_RIGHT, w, h), ...getPts(lm, BROW_RIGHT, w, h)], c, op, 8);
//     ctx.restore();
//   }

//   // Blush — radial gradient on cheek clusters
//   if (cfg.showBlush) {
//     const c = BLUSH_SHADES[cfg.blushIdx].color.join(",");
//     const op = cfg.blushOp * cfg.globalOp;
//     const lPts = getPts(lm, CHEEK_LEFT, w, h);
//     const rPts = getPts(lm, CHEEK_RIGHT, w, h);
//     const faceW = Math.abs(lm[CHEEK_RIGHT[0]].x * w - lm[CHEEK_LEFT[0]].x * w);
//     ctx.save();
//     ctx.globalCompositeOperation = "source-over";
//     const [lcx, lcy] = avg(lPts);
//     const [rcx, rcy] = avg(rPts);
//     radialBlush(ctx, lcx, lcy, faceW * 0.28, faceW * 0.18, c, op);
//     radialBlush(ctx, rcx, rcy, faceW * 0.28, faceW * 0.18, c, op);
//     ctx.restore();
//   }

//   // Lipstick — overlay blend using outer+inner combined
//   {
//     const c = LIP_SHADES[cfg.lipIdx].color.join(",");
//     const op = cfg.lipOp * cfg.globalOp;
//     const lipPts = [...getPts(lm, LIPS_OUTER, w, h), ...getPts(lm, LIPS_INNER, w, h)];
//     ctx.save();
//     ctx.globalCompositeOperation = "overlay";
//     featheredPoly(ctx, lipPts, c, op, 3);
//     ctx.restore();
//   }

//   // Eyeliner — trace EYE_LEFT and EYE_RIGHT paths
//   if (cfg.showLiner) {
//     const op = cfg.linerOp * cfg.globalOp;
//     ctx.save();
//     ctx.strokeStyle = `rgba(20,20,20,${op})`;
//     ctx.lineWidth = 1.5;
//     ctx.lineJoin = "round";
//     ctx.lineCap = "round";
//     ctx.globalCompositeOperation = "source-over";
//     for (const idx of [EYE_LEFT, EYE_RIGHT]) {
//       const pts = getPts(lm, idx, w, h);
//       ctx.beginPath();
//       ctx.moveTo(pts[0][0], pts[0][1]);
//       for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
//       ctx.stroke();
//     }
//     ctx.restore();
//   }
// }

// // ─── FACE DETECTION via MediaPipe (replaces YOLO) ────────────────────────────
// // MediaPipe FaceMesh already detects faces via multiFaceLandmarks.
// // No external .onnx file needed — makeup activates when a face is found.

// // ─── THEME ────────────────────────────────────────────────────────────────────
// const T = {
//   bg: "#faf8f6", bgPanel: "#ffffff", bgCard: "#fdf5f8", bgHdr: "#fff0f5",
//   border: "#f0dde6", accent: "#d4457a", accent2: "#e8729a",
//   text: "#2d1a26", textSub: "#9a7088", textMid: "#6b4a5e",
//   green: "#2e9e6b", red: "#d44545", shadow: "rgba(212,69,122,0.10)",
// };

// // ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
// function SwatchGrid({ shades, selectedIdx, onSelect }) {
//   return (
//     <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "6px 0" }}>
//       {shades.map((s, i) => (
//         <button key={i} title={s.name} onClick={() => onSelect(i)} style={{
//           width: 26, height: 26, borderRadius: "50%",
//           background: `rgb(${s.color.join(",")})`,
//           border: i === selectedIdx ? `3px solid ${T.accent}` : `2px solid ${T.border}`,
//           cursor: "pointer",
//           outline: i === selectedIdx ? `3px solid rgba(212,69,122,0.2)` : "none",
//           outlineOffset: 2,
//           transform: i === selectedIdx ? "scale(1.18)" : "scale(1)",
//           transition: "all 0.15s",
//           boxShadow: i === selectedIdx ? `0 2px 8px rgba(${s.color.join(",")},0.5)` : "0 1px 3px rgba(0,0,0,0.1)",
//         }} />
//       ))}
//     </div>
//   );
// }

// function Section({ title, enabled, onToggle, children, desc }) {
//   return (
//     <div style={{
//       background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14,
//       marginBottom: 10, overflow: "hidden", boxShadow: `0 2px 12px ${T.shadow}`,
//     }}>
//       <div style={{
//         display: "flex", justifyContent: "space-between", alignItems: "center",
//         padding: "10px 14px", background: T.bgHdr, borderBottom: `1px solid ${T.border}`,
//       }}>
//         <span style={{ color: T.accent, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1.5 }}>
//           {title}
//         </span>
//         {onToggle !== undefined && (
//           <button onClick={onToggle} style={{
//             padding: "2px 12px", borderRadius: 20, border: "none", cursor: "pointer",
//             fontSize: 11, fontWeight: 700,
//             background: enabled ? T.green : "#e8e0e4",
//             color: enabled ? "#fff" : T.textSub,
//             letterSpacing: 0.5, transition: "all 0.2s",
//           }}>
//             {enabled ? "ON" : "OFF"}
//           </button>
//         )}
//       </div>
//       <div style={{ padding: "8px 14px 10px" }}>
//         {children}
//         {desc && <p style={{ margin: "5px 0 0", color: T.textSub, fontSize: 11 }}>{desc}</p>}
//       </div>
//     </div>
//   );
// }

// function OpSlider({ label, value, onChange }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
//       <span style={{ color: T.textMid, fontSize: 11, width: 100, flexShrink: 0 }}>{label}</span>
//       <input type="range" min={0} max={1} step={0.01} value={value}
//         onChange={e => onChange(parseFloat(e.target.value))}
//         style={{ flex: 1, accentColor: T.accent, cursor: "pointer" }}
//       />
//       <span style={{ color: T.accent, fontSize: 11, width: 32, textAlign: "right", fontWeight: 600 }}>
//         {value.toFixed(2)}
//       </span>
//     </div>
//   );
// }

// // ─── YOLO STATUS BADGE ────────────────────────────────────────────────────────
// function YoloBadge({ status, personDetected }) {
//   const states = {
//     idle: { label: "YOLO · Idle", bg: "#f0e4ea", col: T.textSub },
//     loading: { label: "YOLO · Loading model…", bg: "#fff3cd", col: "#856404" },
//     ready: { label: "YOLO · No person", bg: "#f0e4ea", col: T.textSub },
//     detected: { label: "✓ Person detected", bg: "#d4edda", col: "#155724" },
//     error: { label: "YOLO · Unavailable", bg: "#fde8e8", col: T.red },
//   };
//   const s = personDetected && status === "ready" ? states.detected : (states[status] || states.idle);
//   return (
//     <div style={{
//       display: "inline-flex", alignItems: "center", gap: 6,
//       padding: "4px 12px", borderRadius: 20,
//       background: s.bg, color: s.col,
//       fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
//       fontFamily: "'Rajdhani',sans-serif",
//       border: `1px solid ${s.col}33`,
//       transition: "all 0.3s",
//     }}>
//       <span style={{
//         width: 7, height: 7, borderRadius: "50%",
//         background: s.col, display: "inline-block",
//         animation: status === "loading" ? "pulse 1s infinite" : "none",
//       }} />
//       {s.label}
//     </div>
//   );
// }

// // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// export default function ARTryOn() {
//   const videoRef = useRef(null);
//   const overlayRef = useRef(null);
//   const faceMeshRef = useRef(null);
//   const cameraRef = useRef(null);
//   const yoloRef = useRef(null);
//   const yoloTimerRef = useRef(null);
//   const cfgRef = useRef({});
//   const frameCount = useRef(0);

//   const [cameraReady, setCameraReady] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [mpLoaded, setMpLoaded] = useState(false);
//   const [yoloStatus, setYoloStatus] = useState("idle");  // idle|loading|ready|error
//   const [personDetected, setPersonDetected] = useState(false);
//   const [makeupActive, setMakeupActive] = useState(false);   // only true when person present

//   // Makeup controls
//   const [foundationIdx, setFoundationIdx] = useState(2);
//   const [lipIdx, setLipIdx] = useState(0);
//   const [blushIdx, setBlushIdx] = useState(1);
//   const [shadowIdx, setShadowIdx] = useState(0);
//   const [showFoundation, setShowFoundation] = useState(false);
//   const [showBlush, setShowBlush] = useState(true);
//   const [showShadow, setShowShadow] = useState(true);
//   const [showLiner, setShowLiner] = useState(true);
//   const [foundationOp, setFoundationOp] = useState(0.35);
//   const [lipOp, setLipOp] = useState(0.45);
//   const [blushOp, setBlushOp] = useState(0.40);
//   const [shadowOp, setShadowOp] = useState(0.32);
//   const [linerOp, setLinerOp] = useState(0.80);
//   const [globalOp, setGlobalOp] = useState(1.0);

//   // Keep cfgRef in sync
//   useEffect(() => {
//     cfgRef.current = {
//       foundationIdx, lipIdx, blushIdx, shadowIdx,
//       showFoundation, showBlush, showShadow, showLiner,
//       foundationOp, lipOp, blushOp, shadowOp, linerOp, globalOp,
//     };
//   }, [foundationIdx, lipIdx, blushIdx, shadowIdx, showFoundation, showBlush, showShadow, showLiner, foundationOp, lipOp, blushOp, shadowOp, linerOp, globalOp]);

//   // Load MediaPipe from CDN (ONNX removed — using built-in face detection)
//   useEffect(() => {
//     const cdnScripts = [
//       "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
//       "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
//     ];
//     let loaded = 0;
//     const trySetLoaded = () => { if (++loaded === cdnScripts.length) setMpLoaded(true); };
//     cdnScripts.forEach(src => {
//       if (document.querySelector(`script[src="${src}"]`)) { trySetLoaded(); return; }
//       const s = document.createElement("script");
//       s.src = src; s.crossOrigin = "anonymous";
//       s.onload = trySetLoaded;
//       s.onerror = () => console.warn("Failed to load:", src);
//       document.head.appendChild(s);
//     });
//     // Fonts
//     if (!document.querySelector('link[href*="Rajdhani"]')) {
//       const link = document.createElement("link");
//       link.rel = "stylesheet";
//       link.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap";
//       document.head.appendChild(link);
//     }
//   }, []);

//   // No YOLO needed — face detection is handled by MediaPipe FaceMesh onResults

//   // Start camera + MediaPipe
//   const startCamera = useCallback(async () => {
//     if (!mpLoaded) return;
//     setLoading(true); setError(null);
//     try {
//       const FaceMesh = window.FaceMesh;
//       const Camera = window.Camera;
//       if (!FaceMesh || !Camera) throw new Error("MediaPipe not ready, try again in a moment.");

//       const fm = new FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
//       fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

//       fm.onResults(results => {
//         const video = videoRef.current;
//         const overlay = overlayRef.current;
//         if (!video || !overlay) return;
//         const w = video.videoWidth || 640;
//         const h = video.videoHeight || 480;
//         overlay.width = w; overlay.height = h;
//         const ctx = overlay.getContext("2d");
//         // Use MediaPipe face detection directly — no ONNX needed
//         const hasFace = results.multiFaceLandmarks?.length > 0;
//         setPersonDetected(hasFace);
//         setMakeupActive(hasFace);
//         if (hasFace) {
//           drawMakeup(ctx, results.multiFaceLandmarks[0], w, h, cfgRef.current);
//         } else {
//           ctx.clearRect(0, 0, w, h);
//         }
//       });

//       faceMeshRef.current = fm;
//       const cam = new Camera(videoRef.current, {
//         onFrame: async () => { await fm.send({ image: videoRef.current }); },
//         width: 640, height: 480,
//       });
//       cameraRef.current = cam;
//       await cam.start();
//       setCameraReady(true);
//     } catch (e) {
//       setError(e.message || "Camera error");
//     } finally {
//       setLoading(false);
//     }
//   }, [mpLoaded]);

//   // Keep makeupActive in cfgRef so the onResults closure sees it
//   useEffect(() => {
//     cfgRef.current._makeupActive = makeupActive;
//   }, [makeupActive]);

//   const stopCamera = useCallback(() => {
//     clearInterval(yoloTimerRef.current);
//     if (cameraRef.current) { cameraRef.current.stop(); cameraRef.current = null; }
//     if (faceMeshRef.current) { faceMeshRef.current.close(); faceMeshRef.current = null; }
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach(t => t.stop());
//       videoRef.current.srcObject = null;
//     }
//     const ov = overlayRef.current;
//     if (ov) ov.getContext("2d").clearRect(0, 0, ov.width, ov.height);
//     setCameraReady(false);
//     setPersonDetected(false);
//     setMakeupActive(false);
//   }, []);

//   useEffect(() => () => stopCamera(), [stopCamera]);

//   return (
//     <div style={{
//       display: "flex", gap: 16, width: "100%", minHeight: "100vh",
//       background: T.bg, fontFamily: "'DM Sans',sans-serif",
//       padding: 16, boxSizing: "border-box",
//     }}>
//       <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

//       {/* ── LEFT: Camera ── */}
//       <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>

//         {/* Header row */}
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             <div style={{
//               width: 40, height: 40, borderRadius: "50%",
//               background: `linear-gradient(135deg,${T.accent},#f7a8c4)`,
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: 20, boxShadow: `0 4px 14px ${T.shadow}`,
//             }}>💄</div>
//             <div>
//               <h1 style={{ margin: 0, color: T.accent, fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
//                 AR MAKEUP STUDIO
//               </h1>
//               <p style={{ margin: 0, color: T.textSub, fontSize: 11 }}>Virtual Try-On · YOLO-gated · Browser Edition</p>
//             </div>
//           </div>
//           {/* YOLO status badge */}
//           {cameraReady && <YoloBadge status={yoloStatus} personDetected={personDetected} />}
//         </div>

//         {/* Video box */}
//         <div style={{
//           position: "relative", borderRadius: 18, overflow: "hidden",
//           background: "#f5eef2", border: `1.5px solid ${T.border}`,
//           boxShadow: `0 4px 32px ${T.shadow}`,
//           aspectRatio: "4/3", width: "100%",
//         }}>
//           <video ref={videoRef} autoPlay playsInline muted
//             style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}
//           />
//           <canvas ref={overlayRef} style={{
//             position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
//             pointerEvents: "none", transform: "scaleX(-1)",
//           }} />

//           {/* Person-gating overlay — dims makeup hint when no person detected */}
//           {cameraReady && !personDetected && yoloStatus === "ready" && (
//             <div style={{
//               position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
//               background: "rgba(45,26,38,0.75)", color: "#fff",
//               padding: "6px 16px", borderRadius: 20, fontSize: 12,
//               backdropFilter: "blur(6px)", whiteSpace: "nowrap",
//               fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1,
//             }}>
//               👤 Move into frame to activate makeup
//             </div>
//           )}

//           {!cameraReady && (
//             <div style={{
//               position: "absolute", inset: 0, display: "flex", flexDirection: "column",
//               alignItems: "center", justifyContent: "center",
//               background: "rgba(253,245,248,0.96)", gap: 14,
//             }}>
//               <div style={{ fontSize: 56, filter: `drop-shadow(0 4px 16px ${T.shadow})` }}>💄</div>
//               <p style={{ color: T.textMid, margin: 0, fontSize: 14, textAlign: "center", padding: "0 28px", lineHeight: 1.6 }}>
//                 Your browser will ask for camera permission.<br />
//                 <span style={{ color: T.textSub, fontSize: 12 }}>
//                   YOLOv8 detects if a person is present · MediaPipe applies makeup to face landmarks.
//                 </span>
//               </p>
//               {yoloStatus === "loading" && (
//                 <p style={{ color: "#856404", fontSize: 12, margin: 0, background: "#fff3cd", padding: "6px 14px", borderRadius: 8 }}>
//                   ⏳ Loading YOLOv8 model…
//                 </p>
//               )}
//               {error && (
//                 <p style={{
//                   color: T.red, margin: 0, fontSize: 12, textAlign: "center", maxWidth: 280,
//                   background: "#fff0f0", padding: "8px 14px", borderRadius: 8, border: "1px solid #fcc"
//                 }}>
//                   ⚠ {error}
//                 </p>
//               )}
//               <button onClick={startCamera} disabled={loading || !mpLoaded} style={{
//                 padding: "12px 36px", borderRadius: 50,
//                 background: loading || !mpLoaded ? "#ece4e9" : `linear-gradient(135deg,${T.accent},#f07aab)`,
//                 border: "none",
//                 color: loading || !mpLoaded ? T.textSub : "#fff",
//                 fontSize: 15, fontWeight: 700, cursor: loading || !mpLoaded ? "not-allowed" : "pointer",
//                 fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1.5,
//                 boxShadow: loading ? "none" : `0 4px 20px rgba(212,69,122,0.3)`,
//                 transition: "all 0.2s",
//               }}>
//                 {!mpLoaded ? "⏳ Loading scripts…" : loading ? "⏳ Starting camera…" : "✨ Launch AR Camera"}
//               </button>
//             </div>
//           )}

//           {cameraReady && (
//             <button onClick={stopCamera} style={{
//               position: "absolute", top: 10, right: 10,
//               padding: "4px 14px", borderRadius: 20,
//               background: "rgba(212,69,90,0.88)", border: "none",
//               color: "#fff", fontSize: 12, fontWeight: 700,
//               cursor: "pointer", backdropFilter: "blur(6px)",
//               boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//             }}>✕ Stop</button>
//           )}
//         </div>

//         {/* Global opacity + YOLO info */}
//         {cameraReady && (
//           <div style={{
//             background: T.bgPanel, borderRadius: 12,
//             border: `1px solid ${T.border}`, padding: "10px 14px",
//             boxShadow: `0 2px 10px ${T.shadow}`,
//           }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//               <p style={{ margin: 0, color: T.accent, fontSize: 12, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 1 }}>
//                 GLOBAL OPACITY
//               </p>
//               <YoloBadge status={yoloStatus} personDetected={personDetected} />
//             </div>
//             <OpSlider label="Master" value={globalOp} onChange={setGlobalOp} />
//             <p style={{ margin: "4px 0 0", color: T.textSub, fontSize: 10 }}>
//               {yoloStatus === "error"
//                 ? "⚠ YOLO unavailable — makeup always active."
//                 : yoloStatus === "loading"
//                   ? "⏳ YOLOv8 loading — makeup will activate once model is ready."
//                   : "Makeup renders only when YOLOv8 confirms a person in frame."}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* ── RIGHT: Controls ── */}
//       <div style={{
//         width: 300, flexShrink: 0, overflowY: "auto", maxHeight: "100vh",
//         paddingRight: 2, scrollbarWidth: "thin",
//         scrollbarColor: `${T.accent2} ${T.bg}`,
//       }}>

//         <Section title="FOUNDATION" enabled={showFoundation}
//           onToggle={() => setShowFoundation(v => !v)}
//           desc="Soft-light over face oval · corrects tone">
//           <SwatchGrid shades={FOUNDATION_SHADES} selectedIdx={foundationIdx}
//             onSelect={i => { setFoundationIdx(i); setShowFoundation(true); }} />
//           <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
//             {FOUNDATION_SHADES[foundationIdx].name}
//           </p>
//           <OpSlider label="Intensity" value={foundationOp} onChange={setFoundationOp} />
//         </Section>

//         <Section title="LIPSTICK" desc="Overlay blend · LIPS_OUTER + LIPS_INNER">
//           <SwatchGrid shades={LIP_SHADES} selectedIdx={lipIdx} onSelect={setLipIdx} />
//           <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
//             {LIP_SHADES[lipIdx].name}
//           </p>
//           <OpSlider label="Intensity" value={lipOp} onChange={setLipOp} />
//         </Section>

//         <Section title="BLUSH" enabled={showBlush}
//           onToggle={() => setShowBlush(v => !v)}
//           desc="Radial gradient · cheek clusters">
//           <SwatchGrid shades={BLUSH_SHADES} selectedIdx={blushIdx} onSelect={setBlushIdx} />
//           <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
//             {BLUSH_SHADES[blushIdx].name}
//           </p>
//           <OpSlider label="Depth" value={blushOp} onChange={setBlushOp} />
//         </Section>

//         <Section title="EYESHADOW" enabled={showShadow}
//           onToggle={() => setShowShadow(v => !v)}
//           desc="Multiply · LID + BROW landmark clusters">
//           <SwatchGrid shades={EYESHADOW_SHADES} selectedIdx={shadowIdx} onSelect={setShadowIdx} />
//           <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
//             {EYESHADOW_SHADES[shadowIdx].name}
//           </p>
//           <OpSlider label="Depth" value={shadowOp} onChange={setShadowOp} />
//         </Section>

//         <Section title="EYELINER" enabled={showLiner}
//           onToggle={() => setShowLiner(v => !v)}
//           desc="Polyline · EYE_LEFT + EYE_RIGHT paths">
//           <OpSlider label="Ink opacity" value={linerOp} onChange={setLinerOp} />
//         </Section>

//         <Section title="FINE TUNE OPACITY">
//           <OpSlider label="Foundation" value={foundationOp} onChange={setFoundationOp} />
//           <OpSlider label="Lipstick" value={lipOp} onChange={setLipOp} />
//           <OpSlider label="Blush" value={blushOp} onChange={setBlushOp} />
//           <OpSlider label="Eyeshadow" value={shadowOp} onChange={setShadowOp} />
//           <OpSlider label="Eyeliner" value={linerOp} onChange={setLinerOp} />
//         </Section>

//         {/* YOLO info card */}
//         <div style={{
//           background: T.bgCard, borderRadius: 12,
//           border: `1px solid ${T.border}`, padding: "10px 14px",
//           marginBottom: 10,
//         }}>
//           <p style={{ margin: "0 0 6px", color: T.accent, fontSize: 12, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 1 }}>
//             YOLO DETECTION INFO
//           </p>
//           <p style={{ margin: "0 0 4px", color: T.textMid, fontSize: 11 }}>Model: YOLOv8n (ONNX Runtime Web)</p>
//           <p style={{ margin: "0 0 4px", color: T.textMid, fontSize: 11 }}>Class: Person (class 0) · conf ≥ 0.45</p>
//           <p style={{ margin: "0 0 4px", color: T.textMid, fontSize: 11 }}>Poll rate: every 500ms</p>
//           <p style={{ margin: 0, color: T.textMid, fontSize: 11 }}>
//             Makeup rendering: <strong style={{ color: makeupActive ? T.green : T.red }}>
//               {makeupActive ? "Active" : "Gated (no person)"}
//             </strong>
//           </p>
//         </div>

//         <p style={{ color: T.textSub, fontSize: 10, textAlign: "center", padding: "4px 0 20px" }}>
//           All processing is done locally in your browser
//         </p>
//       </div>
//     </div>
//   );
// }

// -----------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ════════════════════════════════════════════════════════════════
//  LANDMARK INDICES  (MediaPipe FaceMesh 468-point model)
// ════════════════════════════════════════════════════════════════
const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];
const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
const EYE_LEFT = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const EYE_RIGHT = [362, 398, 384, 385, 386, 387, 388, 466, 263];
const LID_LEFT = [246, 161, 160, 159, 158, 157, 173];
const LID_RIGHT = [466, 388, 387, 386, 385, 384, 398];
const BROW_LEFT = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const BROW_RIGHT = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const CHEEK_LEFT = [100, 119, 120, 121, 126, 116, 117, 118, 101, 123, 137, 93, 205, 138, 135];
const CHEEK_RIGHT = [266, 280, 340, 345, 346, 347, 348, 355, 329, 352, 328, 311, 411, 425, 426];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

// ════════════════════════════════════════════════════════════════
//  SHADE PALETTES  (RGB — converted from Python BGR source)
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  CANVAS HELPERS — Python-equivalent makeup in Canvas2D
//
//  KEY FIXES vs original page.tsx:
//  1. makeFeatheredLayer: uses OffscreenCanvas + ctx.filter='blur'
//     BEFORE fill — this is proper Gaussian edge feathering,
//     matching Python's feathered_poly_mask + GaussianBlur.
//     Original used shadowBlur which is an external glow, not feathering.
//
//  2. makeBlushLayer: correct ellipse transform —
//     translate(cx,cy) → scale(rx/r, ry/r) → arc at origin.
//     Original scaled cx·(r/rx), cy·(r/ry) which distorted position.
//
//  3. Eyeshadow: "soft-light" instead of "multiply".
//     Python uses soft_light_blend; "multiply" is too harsh on
//     mid-to-light skin tones.
// ════════════════════════════════════════════════════════════════

function getPts(lm: any[], idx: number[], w: number, h: number): [number, number][] {
  return idx.map(i => [lm[i].x * w, lm[i].y * h]);
}

function avg(pts: [number, number][]): [number, number] {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

/**
 * Draw a filled polygon on an OffscreenCanvas with Gaussian blur applied
 * BEFORE fill — this creates properly feathered (soft) edges that match
 * Python's cv2.GaussianBlur on a binary mask.
 */
function makeFeatheredLayer(
  w: number, h: number,
  points: [number, number][],
  rgb: number[],
  opacity: number,
  featherPx: number
): OffscreenCanvas {
  const oc = new OffscreenCanvas(w, h);
  const ctx = oc.getContext("2d")!;
  ctx.filter = `blur(${featherPx}px)`;
  ctx.fillStyle = `rgba(${rgb.join(",")},${opacity})`;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
  return oc;
}

/**
 * Draw an elliptical radial gradient on an OffscreenCanvas.
 * Uses the correct transform:  translate → scale → arc at (0,0)
 * so the gradient center stays exactly at (cx, cy).
 * Matches Python's radial_gradient() with rx/ry ratio.
 */
function makeBlushLayer(
  w: number, h: number,
  cx: number, cy: number,
  rx: number, ry: number,
  rgb: number[],
  opacity: number
): OffscreenCanvas {
  const oc = new OffscreenCanvas(w, h);
  const ctx = oc.getContext("2d")!;
  const r = Math.max(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(${rgb.join(",")},${opacity})`);
  g.addColorStop(0.5, `rgba(${rgb.join(",")},${opacity * 0.5})`);
  g.addColorStop(1, `rgba(${rgb.join(",")},0)`);
  ctx.save();
  ctx.translate(cx, cy);   // move origin to ellipse center
  ctx.scale(rx / r, ry / r); // squash into ellipse shape
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  return oc;
}

/** Composite an offscreen layer onto the main canvas with a blend mode. */
function composite(
  ctx: CanvasRenderingContext2D,
  layer: OffscreenCanvas,
  mode: GlobalCompositeOperation
) {
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

/** Full makeup render — called every MediaPipe frame. */
function drawMakeup(
  ctx: CanvasRenderingContext2D,
  lm: any[],
  w: number, h: number,
  cfg: Record<string, any>
) {
  ctx.clearRect(0, 0, w, h);

  // ── Foundation — soft-light over face oval ────────────────────
  if (cfg.showFoundation) {
    const c = FOUNDATION_SHADES[cfg.foundationIdx].color;
    const op = Math.min(cfg.foundationOp * cfg.globalOp * 0.70, 0.70);
    composite(ctx,
      makeFeatheredLayer(w, h, getPts(lm, FACE_OVAL, w, h), c, op, 18),
      "soft-light");
  }

  // ── Eyeshadow — soft-light from lid up to brow ───────────────
  if (cfg.showShadow) {
    const c = EYESHADOW_SHADES[cfg.shadowIdx].color;
    const op = Math.min(cfg.shadowOp * cfg.globalOp, 0.55);
    for (const [lid, brow] of [[LID_LEFT, BROW_LEFT], [LID_RIGHT, BROW_RIGHT]]) {
      const pts = [...getPts(lm, lid, w, h), ...getPts(lm, brow, w, h)] as [number, number][];
      composite(ctx, makeFeatheredLayer(w, h, pts, c, op, 8), "soft-light");
    }
  }

  // ── Blush — elliptical radial gradient on cheeks ─────────────
  if (cfg.showBlush) {
    const c = BLUSH_SHADES[cfg.blushIdx].color;
    const op = Math.min(cfg.blushOp * cfg.globalOp, 0.65);
    const lPts = getPts(lm, CHEEK_LEFT, w, h);
    const rPts = getPts(lm, CHEEK_RIGHT, w, h);
    const faceW = Math.abs(lm[CHEEK_RIGHT[0]].x * w - lm[CHEEK_LEFT[0]].x * w);
    const rx = faceW * 0.65, ry = faceW * 0.35;
    for (const pts of [lPts, rPts]) {
      const [cx, cy] = avg(pts);
      composite(ctx, makeBlushLayer(w, h, cx, cy, rx, ry, c, op), "source-over");
    }
  }

  // ── Lipstick — overlay blend, tight feather ──────────────────
  {
    const c = LIP_SHADES[cfg.lipIdx].color;
    const op = Math.min(cfg.lipOp * cfg.globalOp, 0.85);
    const pts = [...getPts(lm, LIPS_OUTER, w, h), ...getPts(lm, LIPS_INNER, w, h)] as [number, number][];
    composite(ctx, makeFeatheredLayer(w, h, pts, c, op, 3), "overlay");
  }

  // ── Eyeliner — polylines, source-over ────────────────────────
  if (cfg.showLiner) {
    const op = cfg.linerOp * cfg.globalOp;
    ctx.save();
    ctx.strokeStyle = `rgba(20,20,20,${op})`;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "source-over";
    for (const idx of [EYE_LEFT, EYE_RIGHT]) {
      const pts = getPts(lm, idx, w, h);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════════════
//  YOLO ONNX HELPERS
//
//  Setup (one-time):
//    1. pip install ultralytics
//    2. python -c "from ultralytics import YOLO; YOLO('yoloface.pt').export(format='onnx')"
//    3. Copy yolov8n-face.onnx → /public/models/yolov8n-face.onnx
//    4. npm install onnxruntime-web
// ════════════════════════════════════════════════════════════════
const YOLO_SIZE = 640;
const YOLO_CONF = 0.45;

/** Resize video frame to 640×640 and return NCHW Float32Array. */
function preprocessYOLO(video: HTMLVideoElement): Float32Array {
  const oc = new OffscreenCanvas(YOLO_SIZE, YOLO_SIZE);
  const ctx = oc.getContext("2d")!;
  ctx.drawImage(video, 0, 0, YOLO_SIZE, YOLO_SIZE);
  const px = ctx.getImageData(0, 0, YOLO_SIZE, YOLO_SIZE).data;
  const n = YOLO_SIZE * YOLO_SIZE;
  const t = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    t[0 * n + i] = px[i * 4 + 0] / 255; // R channel
    t[1 * n + i] = px[i * 4 + 1] / 255; // G channel
    t[2 * n + i] = px[i * 4 + 2] / 255; // B channel
  }
  return t;
}

/**
 * Parse YOLOv8-face ONNX output and return true if any face passes conf threshold.
 * Handles both transpose layouts that ultralytics may produce:
 *   [1, 5, 8400]   → transposed (conf at row 4)
 *   [1, 8400, 5+]  → non-transposed (conf at col 4)
 */
function yoloHasFace(data: Float32Array, dims: number[]): boolean {
  const [, a, b] = dims;
  if (a < b) {
    // Transposed: dims = [1, 5, 8400] — conf is the 5th row
    for (let i = 0; i < b; i++) if (data[4 * b + i] >= YOLO_CONF) return true;
  } else {
    // Non-transposed: dims = [1, 8400, 5+] — conf is col 4 in each row
    for (let i = 0; i < a; i++) if (data[i * b + 4] >= YOLO_CONF) return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════════════════════
const T = {
  bg: "#faf8f6", bgPanel: "#ffffff", bgCard: "#fdf5f8", bgHdr: "#fff0f5",
  border: "#f0dde6", accent: "#d4457a", accent2: "#e8729a",
  text: "#2d1a26", textSub: "#9a7088", textMid: "#6b4a5e",
  green: "#2e9e6b", red: "#d44545", shadow: "rgba(212,69,122,0.10)",
};

// ════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════
function SwatchGrid({ shades, selectedIdx, onSelect }: {
  shades: { name: string, color: number[] }[];
  selectedIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "6px 0" }}>
      {shades.map((s, i) => (
        <button
          key={i} title={s.name}
          onClick={() => onSelect(i)}
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: `rgb(${s.color.join(",")})`,
            border: i === selectedIdx ? `3px solid ${T.accent}` : `2px solid ${T.border}`,
            cursor: "pointer",
            outline: i === selectedIdx ? `3px solid rgba(212,69,122,0.2)` : "none",
            outlineOffset: 2,
            transform: i === selectedIdx ? "scale(1.18)" : "scale(1)",
            transition: "all 0.15s",
            boxShadow: i === selectedIdx
              ? `0 2px 8px rgba(${s.color.join(",")},0.5)`
              : "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />
      ))}
    </div>
  );
}

function Section({ title, enabled, onToggle, children, desc }: {
  title: string;
  enabled?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  desc?: string;
}) {
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14,
      marginBottom: 10, overflow: "hidden", boxShadow: `0 2px 12px ${T.shadow}`,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", background: T.bgHdr, borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{
          color: T.accent, fontFamily: "'Rajdhani',sans-serif",
          fontWeight: 700, fontSize: 13, letterSpacing: 1.5,
        }}>{title}</span>
        {onToggle !== undefined && (
          <button onClick={onToggle} style={{
            padding: "2px 12px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5, transition: "all 0.2s",
            background: enabled ? T.green : "#e8e0e4",
            color: enabled ? "#fff" : T.textSub,
          }}>{enabled ? "ON" : "OFF"}</button>
        )}
      </div>
      <div style={{ padding: "8px 14px 10px" }}>
        {children}
        {desc && <p style={{ margin: "5px 0 0", color: T.textSub, fontSize: 11 }}>{desc}</p>}
      </div>
    </div>
  );
}

function OpSlider({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ color: T.textMid, fontSize: 11, width: 100, flexShrink: 0 }}>{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: T.accent, cursor: "pointer" }}
      />
      <span style={{
        color: T.accent, fontSize: 11, width: 32, textAlign: "right", fontWeight: 600,
      }}>{value.toFixed(2)}</span>
    </div>
  );
}

function DetectionBadge({ yoloStatus, faceDetected }: {
  yoloStatus: string; faceDetected: boolean;
}) {
  const s = (yoloStatus === "ready" && faceDetected)
    ? { label: "✓ Face Detected", bg: "#d4edda", col: "#155724" }
    : yoloStatus === "loading"
      ? { label: "YOLO · Loading…", bg: "#fff3cd", col: "#856404" }
      : yoloStatus === "error"
        ? { label: "YOLO Fallback · MP", bg: "#fff3cd", col: "#856404" }
        : { label: "YOLO · Scanning…", bg: "#f0e4ea", col: T.textSub };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20,
      background: s.bg, color: s.col,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
      fontFamily: "'Rajdhani',sans-serif",
      border: `1px solid ${s.col}33`, transition: "all 0.3s",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: s.col, display: "inline-block",
        animation: yoloStatus === "loading" ? "pulse 1s infinite" : "none",
      }} />
      {s.label}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function ARTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const yoloRef = useRef<{ ort: any; session: any } | null>(null);
  const yoloTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cfgRef = useRef<Record<string, any>>({});
  // Ref so MediaPipe's onResults closure always sees the latest YOLO result
  // without stale-closure issues from useState.
  const faceDetRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpLoaded, setMpLoaded] = useState(false);
  // "idle" | "loading" | "ready" | "error"
  const [yoloStatus, setYoloStatus] = useState("idle");
  const [faceDetected, setFaceDetected] = useState(false);

  // ── Makeup controls ────────────────────────────────────────────
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

  // Sync cfgRef every render (no dependency array) so every
  // MediaPipe frame always reads the latest slider values.
  useEffect(() => {
    cfgRef.current = {
      foundationIdx, lipIdx, blushIdx, shadowIdx,
      showFoundation, showBlush, showShadow, showLiner,
      foundationOp, lipOp, blushOp, shadowOp, linerOp, globalOp,
    };
  });

  // ── Load MediaPipe scripts from CDN ──────────────────────────
  useEffect(() => {
    const srcs = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
    ];
    let n = 0;
    const tick = () => { if (++n === srcs.length) setMpLoaded(true); };
    srcs.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) { tick(); return; }
      const s = document.createElement("script");
      s.src = src; s.crossOrigin = "anonymous";
      s.onload = tick;
      s.onerror = tick; // still proceed even if one fails
      document.head.appendChild(s);
    });
    if (!document.querySelector('link[href*="Rajdhani"]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  // ── Load YOLO ONNX model ──────────────────────────────────────
  const loadYOLO = useCallback(async () => {
    setYoloStatus("loading");
    try {
      // Requires: npm install onnxruntime-web
      // Model file: /public/models/yolov8n-face.onnx
      // Export:     YOLO('yoloface.pt').export(format='onnx')
      // const ort = await import("onnxruntime-web");
      // const session = await (ort as any).InferenceSession.create(
      //   "/models/yolov8n-face.onnx",
      //   { executionProviders: ["wasm"] }
      // );
      yoloRef.current = { ort, session };
      setYoloStatus("ready");
      console.log("[YOLO] Model loaded ✓");
    } catch (e) {
      console.warn("[YOLO] Load failed — falling back to MediaPipe face detection:", e);
      setYoloStatus("error");
    }
  }, []);

  // ── YOLO polling loop (every 300 ms) ─────────────────────────
  const startYOLOLoop = useCallback(() => {
    yoloTimerRef.current = setInterval(async () => {
      const video = videoRef.current;
      const yolo = yoloRef.current;
      if (!video || !yolo || video.readyState < 2) return;
      try {
        const { ort, session } = yolo;
        const data = preprocessYOLO(video);
        const tensor = new (ort as any).Tensor("float32", data, [1, 3, YOLO_SIZE, YOLO_SIZE]);
        const out = await session.run({ images: tensor });
        // ultralytics exports use "output0"; fall back to first key
        const t = out["output0"] ?? Object.values(out)[0] as any;
        const detected = yoloHasFace(t.data, t.dims);
        faceDetRef.current = detected;
        setFaceDetected(detected);
      } catch (_) { /* ignore single-frame errors */ }
    }, 300);
  }, []);

  // ── Start camera + MediaPipe ──────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!mpLoaded) return;
    setLoading(true); setError(null);
    try {
      const FaceMesh = (window as any).FaceMesh;
      const Camera = (window as any).Camera;
      if (!FaceMesh || !Camera)
        throw new Error("MediaPipe not ready yet — try again in a moment.");

      const fm = new FaceMesh({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      fm.setOptions({
        maxNumFaces: 1, refineLandmarks: true,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });

      fm.onResults((results: any) => {
        const video = videoRef.current;
        const overlay = overlayRef.current;
        if (!video || !overlay) return;

        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        overlay.width = w;
        overlay.height = h;
        const ctx = overlay.getContext("2d")!;

        const mpHasFace = (results.multiFaceLandmarks?.length ?? 0) > 0;

        // Gate: YOLO controls makeup if loaded, else MediaPipe presence
        let gate: boolean;
        if (yoloRef.current) {
          gate = faceDetRef.current; // YOLO result (updated every 300ms)
        } else {
          gate = mpHasFace;          // fallback to MediaPipe detection
          faceDetRef.current = mpHasFace;
          setFaceDetected(mpHasFace);
        }

        if (gate && mpHasFace) {
          drawMakeup(ctx, results.multiFaceLandmarks[0], w, h, cfgRef.current);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
      });

      faceMeshRef.current = fm;
      const cam = new Camera(videoRef.current!, {
        onFrame: async () => { await fm.send({ image: videoRef.current! }); },
        width: 640, height: 480,
      });
      cameraRef.current = cam;
      await cam.start();
      setCameraReady(true);

      // Load YOLO in background — camera stays live while model fetches
      loadYOLO().then(() => {
        if (yoloRef.current) startYOLOLoop();
      });
    } catch (e: any) {
      setError(e.message || "Camera error");
    } finally {
      setLoading(false);
    }
  }, [mpLoaded, loadYOLO, startYOLOLoop]);

  const stopCamera = useCallback(() => {
    if (yoloTimerRef.current) clearInterval(yoloTimerRef.current);
    cameraRef.current?.stop(); cameraRef.current = null;
    faceMeshRef.current?.close(); faceMeshRef.current = null;
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    const ov = overlayRef.current;
    if (ov) ov.getContext("2d")!.clearRect(0, 0, ov.width, ov.height);
    setCameraReady(false);
    setFaceDetected(false);
    faceDetRef.current = false;
    setYoloStatus("idle");
    yoloRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{
      display: "flex", gap: 16, width: "100%", minHeight: "100vh",
      background: T.bg, fontFamily: "'DM Sans',sans-serif",
      padding: 16, boxSizing: "border-box",
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

      {/* ═══ LEFT: Camera view ═══ */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.accent},#f7a8c4)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: `0 4px 14px ${T.shadow}`,
            }}>💄</div>
            <div>
              <h1 style={{
                margin: 0, color: T.accent,
                fontFamily: "'Rajdhani',sans-serif",
                fontSize: 22, fontWeight: 700, letterSpacing: 2,
              }}>AR MAKEUP STUDIO</h1>
              <p style={{ margin: 0, color: T.textSub, fontSize: 11 }}>
                Virtual Try-On · YOLOv8-face + MediaPipe 468pt
              </p>
            </div>
          </div>
          {cameraReady && <DetectionBadge yoloStatus={yoloStatus} faceDetected={faceDetected} />}
        </div>

        {/* Video + overlay canvas */}
        <div style={{
          position: "relative", borderRadius: 18, overflow: "hidden",
          background: "#f5eef2", border: `1.5px solid ${T.border}`,
          boxShadow: `0 4px 32px ${T.shadow}`, aspectRatio: "4/3", width: "100%",
        }}>
          <video ref={videoRef} autoPlay playsInline muted style={{
            width: "100%", height: "100%", objectFit: "cover",
            display: "block", transform: "scaleX(-1)",
          }} />
          {/* Overlay canvas mirrors the video flip */}
          <canvas ref={overlayRef} style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            pointerEvents: "none", transform: "scaleX(-1)",
          }} />

          {/* "look at camera" hint */}
          {cameraReady && !faceDetected && yoloStatus !== "loading" && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(45,26,38,0.78)", color: "#fff",
              padding: "6px 18px", borderRadius: 20, fontSize: 12,
              backdropFilter: "blur(6px)", whiteSpace: "nowrap",
              fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1,
            }}>
              👤 Look at the camera to activate makeup
            </div>
          )}

          {/* YOLO loading overlay */}
          {cameraReady && yoloStatus === "loading" && (
            <div style={{
              position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
              background: "rgba(255,243,205,0.92)", color: "#856404",
              padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              backdropFilter: "blur(4px)", whiteSpace: "nowrap",
              fontFamily: "'Rajdhani',sans-serif", letterSpacing: 0.8,
            }}>
              ⏳ Loading YOLOv8-face model…
            </div>
          )}

          {/* Pre-launch screen */}
          {!cameraReady && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(253,245,248,0.96)", gap: 14,
            }}>
              <div style={{ fontSize: 56, filter: `drop-shadow(0 4px 16px ${T.shadow})` }}>💄</div>
              <p style={{
                color: T.textMid, margin: 0, fontSize: 14,
                textAlign: "center", padding: "0 28px", lineHeight: 1.6,
              }}>
                Allow camera access to begin.<br />
                <span style={{ color: T.textSub, fontSize: 12 }}>
                  YOLOv8-face gates makeup · MediaPipe places it on 468 landmarks.
                </span>
              </p>
              {error && (
                <p style={{
                  color: T.red, margin: 0, fontSize: 12,
                  textAlign: "center", maxWidth: 300,
                  background: "#fff0f0", padding: "8px 14px",
                  borderRadius: 8, border: "1px solid #fcc",
                }}>⚠ {error}</p>
              )}
              <button
                onClick={startCamera}
                disabled={loading || !mpLoaded}
                style={{
                  padding: "12px 36px", borderRadius: 50, border: "none",
                  background: loading || !mpLoaded
                    ? "#ece4e9"
                    : `linear-gradient(135deg,${T.accent},#f07aab)`,
                  color: loading || !mpLoaded ? T.textSub : "#fff",
                  fontSize: 15, fontWeight: 700,
                  cursor: loading || !mpLoaded ? "not-allowed" : "pointer",
                  fontFamily: "'Rajdhani',sans-serif", letterSpacing: 1.5,
                  boxShadow: loading ? "none" : `0 4px 20px rgba(212,69,122,0.3)`,
                  transition: "all 0.2s",
                }}
              >
                {!mpLoaded ? "⏳ Loading scripts…" : loading ? "⏳ Starting…" : "✨ Launch AR Camera"}
              </button>
            </div>
          )}

          {cameraReady && (
            <button onClick={stopCamera} style={{
              position: "absolute", top: 10, right: 10,
              padding: "4px 14px", borderRadius: 20,
              background: "rgba(212,69,90,0.88)", border: "none",
              color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", backdropFilter: "blur(6px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>✕ Stop</button>
          )}
        </div>

        {/* Global opacity panel (shown only when camera is live) */}
        {cameraReady && (
          <div style={{
            background: T.bgPanel, borderRadius: 12,
            border: `1px solid ${T.border}`, padding: "10px 14px",
            boxShadow: `0 2px 10px ${T.shadow}`,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 8,
            }}>
              <p style={{
                margin: 0, color: T.accent, fontSize: 12,
                fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 1,
              }}>GLOBAL OPACITY</p>
              <DetectionBadge yoloStatus={yoloStatus} faceDetected={faceDetected} />
            </div>
            <OpSlider label="Master" value={globalOp} onChange={setGlobalOp} />
            <p style={{ margin: "4px 0 0", color: T.textSub, fontSize: 10 }}>
              {yoloStatus === "error"
                ? "⚠ YOLO unavailable — using MediaPipe detection as fallback."
                : yoloStatus === "loading"
                  ? "⏳ Fetching YOLOv8-face ONNX — makeup uses MediaPipe until ready."
                  : "Makeup renders only when YOLOv8-face confirms a face in frame."}
            </p>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Controls panel ═══ */}
      <div style={{
        width: 300, flexShrink: 0, overflowY: "auto",
        maxHeight: "100vh", paddingRight: 2,
        scrollbarWidth: "thin", scrollbarColor: `${T.accent2} ${T.bg}`,
      }}>

        <Section title="FOUNDATION" enabled={showFoundation}
          onToggle={() => setShowFoundation(v => !v)}
          desc="Soft-light blend over face oval · smooths & tones">
          <SwatchGrid shades={FOUNDATION_SHADES} selectedIdx={foundationIdx}
            onSelect={i => { setFoundationIdx(i); setShowFoundation(true); }} />
          <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
            {FOUNDATION_SHADES[foundationIdx].name}
          </p>
          <OpSlider label="Intensity" value={foundationOp} onChange={setFoundationOp} />
        </Section>

        <Section title="LIPSTICK"
          desc="Overlay blend · outer + inner lip landmarks">
          <SwatchGrid shades={LIP_SHADES} selectedIdx={lipIdx} onSelect={setLipIdx} />
          <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
            {LIP_SHADES[lipIdx].name}
          </p>
          <OpSlider label="Intensity" value={lipOp} onChange={setLipOp} />
        </Section>

        <Section title="BLUSH" enabled={showBlush}
          onToggle={() => setShowBlush(v => !v)}
          desc="Elliptical radial gradient · cheek landmark clusters">
          <SwatchGrid shades={BLUSH_SHADES} selectedIdx={blushIdx} onSelect={setBlushIdx} />
          <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
            {BLUSH_SHADES[blushIdx].name}
          </p>
          <OpSlider label="Depth" value={blushOp} onChange={setBlushOp} />
        </Section>

        <Section title="EYESHADOW" enabled={showShadow}
          onToggle={() => setShowShadow(v => !v)}
          desc="Soft-light blend · lid-to-brow gradient">
          <SwatchGrid shades={EYESHADOW_SHADES} selectedIdx={shadowIdx} onSelect={setShadowIdx} />
          <p style={{ margin: "4px 0 6px", color: T.textMid, fontSize: 12, fontWeight: 500 }}>
            {EYESHADOW_SHADES[shadowIdx].name}
          </p>
          <OpSlider label="Depth" value={shadowOp} onChange={setShadowOp} />
        </Section>

        <Section title="EYELINER" enabled={showLiner}
          onToggle={() => setShowLiner(v => !v)}
          desc="Polylines · upper lash-line landmarks">
          <OpSlider label="Ink opacity" value={linerOp} onChange={setLinerOp} />
        </Section>

        <Section title="FINE-TUNE OPACITY">
          <OpSlider label="Foundation" value={foundationOp} onChange={setFoundationOp} />
          <OpSlider label="Lipstick" value={lipOp} onChange={setLipOp} />
          <OpSlider label="Blush" value={blushOp} onChange={setBlushOp} />
          <OpSlider label="Eyeshadow" value={shadowOp} onChange={setShadowOp} />
          <OpSlider label="Eyeliner" value={linerOp} onChange={setLinerOp} />
        </Section>

        {/* Model pipeline info */}
        <div style={{
          background: T.bgCard, borderRadius: 12,
          border: `1px solid ${T.border}`, padding: "10px 14px", marginBottom: 10,
        }}>
          <p style={{
            margin: "0 0 6px", color: T.accent, fontSize: 12,
            fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 1,
          }}>MODEL PIPELINE</p>

          <p style={{ margin: "0 0 3px", color: T.textMid, fontSize: 11 }}>
            <strong>Detection:</strong> YOLOv8n-face (ONNX Runtime Web)
          </p>
          <p style={{ margin: "0 0 3px", color: T.textMid, fontSize: 11 }}>
            <strong>Landmarks:</strong> MediaPipe FaceMesh (468pt + refined)
          </p>
          <p style={{ margin: "0 0 3px", color: T.textMid, fontSize: 11 }}>
            Conf ≥ {YOLO_CONF} · YOLO poll: 300 ms
          </p>
          <p style={{ margin: "0 0 8px", color: T.textMid, fontSize: 11 }}>
            YOLO:{" "}
            <strong style={{
              color: yoloStatus === "ready" ? T.green
                : yoloStatus === "error" ? "#856404"
                  : T.red,
            }}>{yoloStatus}</strong>
            {" · "}Face:{" "}
            <strong style={{ color: faceDetected ? T.green : T.red }}>
              {faceDetected ? "detected" : "none"}
            </strong>
          </p>

          <div style={{
            borderTop: `1px solid ${T.border}`, paddingTop: 8,
            color: T.textSub, fontSize: 10, lineHeight: 1.6,
          }}>
            <strong>One-time model export:</strong><br />
            <code style={{ fontSize: 9, background: "#f5ecf0", padding: "1px 4px", borderRadius: 3 }}>
              YOLO('yoloface.pt').export(format='onnx')
            </code><br />
            Place output at:<br />
            <code style={{ fontSize: 9, background: "#f5ecf0", padding: "1px 4px", borderRadius: 3 }}>
              /public/models/yolov8n-face.onnx
            </code><br />
            Then: <code style={{ fontSize: 9, background: "#f5ecf0", padding: "1px 4px", borderRadius: 3 }}>
              npm install onnxruntime-web
            </code>
          </div>
        </div>

        <p style={{ color: T.textSub, fontSize: 10, textAlign: "center", padding: "4px 0 20px" }}>
          All processing runs locally in your browser
        </p>
      </div>
    </div>
  );
}