# #!/usr/bin/env python
from ultralytics import YOLO

model = YOLO("yolov8n-face.pt")
model.export(format="onnx")
# """
# AR Virtual Makeup Studio – version 6
# ----------------------------------

# Live webcam stream + MediaPipe Face‑Mesh + configurable makeup effects.
# The UI is built with Tkinter (dark theme, scrollable panel). All
# state‑mutating logic lives in the global `state` dict and is modified
# by the GUI sliders/toggles. The camera loop runs in a background
# thread so the UI never blocks.

# Dependencies:
#     pip install opencv-python mediapipe ultralytics pillow
# """

# # ----------------------------------------------------------------------
# #  Imports
# # ----------------------------------------------------------------------
# import threading
# import cv2
# import numpy as np
# import mediapipe as mp
# from ultralytics import YOLO
# from pathlib import Path
# from typing import Dict, Tuple

# import tkinter as tk
# from tkinter import ttk
# from tkinter import messagebox

# # ----------------------------------------------------------------------
# #  Global application state
# # ----------------------------------------------------------------------
# state: Dict[str, any] = {
#     # ---------- Visibility toggles ----------
#     "show_foundation": False,
#     "show_lip":        True,
#     "show_blush":      True,
#     "show_shadow":     True,
#     "show_liner":      True,

#     # ---------- Selected shade indices ----------
#     "foundation_idx": 2,
#     "lip_idx":        0,
#     "blush_idx":      1,
#     "shadow_idx":     0,

#     # ---------- Opacity values (0.0 … 1.0) ----------
#     "global_op":      1.0,   # master scaler
#     "foundation_op":  0.35,
#     "lip_op":         0.55,
#     "blush_op":       0.65,
#     "shadow_op":      0.55,
#     "liner_op":       1.0,   # fully opaque line by default
# }

# # ----------------------------------------------------------------------
# #  Model initialisation (run once at import time)
# # ----------------------------------------------------------------------
# YOLO_MODEL_PATH = Path("yolov8n-face.pt")
# # If it doesn't exist, ultralytics will auto-download it when YOLO() is called.

# yolo = YOLO(str(YOLO_MODEL_PATH))

# mp_face_mesh = mp.solutions.face_mesh
# face_mesh = mp_face_mesh.FaceMesh(
#     max_num_faces=1,
#     refine_landmarks=True,
#     min_detection_confidence=0.5,
#     min_tracking_confidence=0.5,
# )

# # ----------------------------------------------------------------------
# #  Colour / shade definitions (same layout you already used)
# # ----------------------------------------------------------------------
# LIP_SHADES = [
#     ("Classic Red",    (0,   0,   200)),
#     ("Hot Pink",       (180, 50, 255)),
#     ("Nude Beige",     (100,130,180)),
#     ("Berry",          (120,30,140)),
#     ("Coral",          (80,130,255)),
#     ("Plum",           (100,20,120)),
#     ("Burgundy",       (40, 0, 128)),
#     ("Sepia Brown",    (65,66,112)),
# ]

# BLUSH_SHADES = [
#     ("Watermelon", (133,108,252), 0.40, "round"),
#     ("Flamingo",   (172,200,252), 0.45, "round"),
#     ("Coral",      (121,131,248), 0.40, "round"),
#     ("Salmon",     (153,153,255), 0.40, "round"),
#     ("Pastel Pink",(220,209,255), 0.50, "round"),
#     ("Bubblegum",  (193,193,255), 0.45, "round"),
#     ("Dark Pink",  (128,84,231),  0.40, "round"),
#     ("Bright Pink",(127,0,255),   0.45, "round"),
# ]

# FOUNDATION_SHADES = [
#     ("Porcelain", (215,215,230), 9),
#     ("Ivory",      (200,210,220), 9),
#     ("Sand",       (175,190,205), 9),
#     ("Beige",      (150,170,185), 11),
#     ("Tan",        (110,140,165), 11),
#     ("Espresso",    (70, 95,120), 13),
# ]

# EYESHADOW_SHADES = [
#     ("Soft Brown",   (60, 80,140), 0.30),
#     ("Smoky Grey",   (60, 60, 70), 0.38),
#     ("Rose Gold",    (100,120,200),0.32),
#     ("Purple Haze",  (150,50,180), 0.35),
#     ("Champagne",    (120,160,200),0.25),
#     ("Forest Green", (40,100, 50),0.40),
# ]

# # Landmark groups
# LIPS_OUTER = [61,185,40,39,37,0,267,269,270,409,291,
#               308,324,318,402,317,14,87,178,88,95,78]
# LIPS_INNER = [78,95,88,178,87,14,317,402,318,324,308,
#               291,375,321,405,314,17,84,181,91,146,61]
# EYE_LEFT  = [33, 246, 161, 160, 159, 158, 157, 173, 133]
# EYE_RIGHT = [362, 398, 384, 385, 386, 387, 388, 466, 263]
# LID_LEFT   = [246,161,160,159,158,157,173]
# LID_RIGHT  = [466,388,387,386,385,384,398]
# BROW_LEFT  = [70,63,105,66,107,55,65,52,53,46]
# BROW_RIGHT = [300,293,334,296,336,285,295,282,283,276]
# CHEEK_LEFT_CLUSTER = [
#     100, 119, 120, 121, 126,
#     116, 117, 118, 101, 123,
#     137,  93, 205, 138, 135,
# ]
# CHEEK_RIGHT_CLUSTER = [
#     266, 280, 340, 345, 346,
#     347, 348, 355, 329, 352,
#     328, 311, 411, 425, 426,
# ]
# FACE_OVAL = [
#     10,338,297,332,284,251,389,356,454,323,361,288,
#     397,365,379,378,400,377,152,148,176,149,150,136,
#     172,58,132,93,234,127,162,21,54,103,67,109,10
# ]


# # ----------------------------------------------------------------------
# #  Helper utilities – colour conversion & mask generation
# # ----------------------------------------------------------------------
# def bgr_to_hex(bgr: Tuple[int, int, int]) -> str:
#     """Convert BGR tuple → '#RRGGBB' for Tkinter."""
#     b, g, r = bgr
#     return f"#{r:02x}{g:02x}{b:02x}"


# def luminance(bgr: Tuple[int, int, int]) -> float:
#     """Return perceived luminance – used to decide text colour on swatches."""
#     b, g, r = bgr
#     return 0.299 * r + 0.587 * g + 0.114 * b


# def feathered_poly_mask(shape: Tuple[int, int, int], points: np.ndarray, feather: int = 5) -> np.ndarray:
#     """Create a soft‑edged binary mask from a polygon."""
#     mask = np.zeros(shape[:2], dtype=np.uint8)
#     hull = cv2.convexHull(points)
#     cv2.fillConvexPoly(mask, hull, 255)
#     k = feather * 2 + 1
#     mask = cv2.GaussianBlur(mask, (k, k), 0)
#     return mask.astype(np.float32) / 255.0


# def radial_gradient(shape, centre, rx, ry, angle_deg=0) -> np.ndarray:
#     """Radial gradient used for blush / shadow blends."""
#     h, w = shape[:2]
#     Y, X = np.ogrid[:h, :w]
#     cx, cy = centre
#     th = np.radians(angle_deg)
#     dx = (X - cx) * np.cos(th) + (Y - cy) * np.sin(th)
#     dy = -(X - cx) * np.sin(th) + (Y - cy) * np.cos(th)
#     dist = np.sqrt((dx / (rx + 1e-6)) ** 2 + (dy / (ry + 1e-6)) ** 2)
#     return np.clip(1.0 - dist, 0, 1).astype(np.float32) ** 1.5


# # ----------------------------------------------------------------------
# #  Blending primitives (all respect the granular opacity values)
# # ----------------------------------------------------------------------
# def overlay_blend(base, layer):
#     """Overlay blend – used for lipstick."""
#     b = base.astype(np.float32) / 255.0
#     l = layer.astype(np.float32) / 255.0
#     r = np.where(b < 0.5, 2.0 * b * l, 1.0 - 2.0 * (1.0 - b) * (1.0 - l))
#     return np.clip(r * 255, 0, 255).astype(np.uint8)


# def soft_light_blend(base, layer):
#     """Soft‑light blend – used for blush / eyeshadow."""
#     b = base.astype(np.float32) / 255.0
#     l = layer.astype(np.float32) / 255.0
#     r = (1 - 2 * l) * b ** 2 + 2 * l * b
#     return np.clip(r * 255, 0, 255).astype(np.uint8)


# def alpha_composite(frame, color_layer, alpha_mask, blend_fn=None):
#     """Composite `color_layer` under `frame` respecting alpha and optional blend."""
#     blended = blend_fn(frame, color_layer) if blend_fn else color_layer
#     a = alpha_mask[..., None]
#     out = frame.astype(np.float32) * (1 - a) + blended.astype(np.float32) * a
#     return np.clip(out, 0, 255).astype(np.uint8)


# # ----------------------------------------------------------------------
# #  Makeup effect functions – each reads its own opacity entry
# # ----------------------------------------------------------------------
# def apply_foundation(frame, pts):
#     """Smooth skin + colour tint."""
#     name, tint, smooth_d = FOUNDATION_SHADES[state["foundation_idx"]]
#     opacity = min(state["foundation_op"] * state["global_op"], 0.70)

#     oval = pts[FACE_OVAL].astype(np.int32)
#     mask = np.zeros(frame.shape[:2], dtype=np.uint8)
#     cv2.fillPoly(mask, [oval], 255)

#     ys, xs = np.where(mask > 10)
#     if len(ys) == 0:
#         return frame
    
#     y0, y1_ = ys.min(), ys.max()
#     x0, x1_ = xs.min(), xs.max()
    
#     # smooth inside the face‑oval
#     blurred = frame.copy()
#     blurred[y0:y1_, x0:x1_] = cv2.bilateralFilter(frame[y0:y1_, x0:x1_], d=smooth_d, sigmaColor=75, sigmaSpace=75)
    
#     a = cv2.GaussianBlur(mask, (61,61), 0).astype(np.float32) / 255.0
#     a3 = a[..., np.newaxis]
    
#     base = (frame.astype(np.float32) * (1 - a3 * 0.6) +
#             blurred.astype(np.float32) * (a3 * 0.6))

#     # colour tint
#     tint_layer = np.full_like(frame, tint, dtype=np.uint8)
#     tinted = soft_light_blend(base.astype(np.uint8), tint_layer)

#     return alpha_composite(base.astype(np.uint8), tinted, a * opacity)


# def apply_lipstick(frame, pts):
#     """Overlay blend with user‑selected lipstick colour."""
#     if not state["show_lip"]:
#         return frame
#     _, colour = LIP_SHADES[state["lip_idx"]]
#     opacity = min(state["lip_op"] * state["global_op"], 0.85)

#     all_lips = np.concatenate([pts[LIPS_OUTER], pts[LIPS_INNER]])
#     mask = feathered_poly_mask(frame.shape, all_lips, feather=3)
#     colour_layer = np.full_like(frame, colour, dtype=np.uint8)

#     return alpha_composite(frame, colour_layer, mask * opacity, blend_fn=overlay_blend)


# def apply_blush(frame, pts):
#     """Soft‑light blush with radial gradient."""
#     if not state["show_blush"]:
#         return frame
#     name, colour, base_op, shape = BLUSH_SHADES[state["blush_idx"]]
#     opacity = min(base_op * state["blush_op"] * state["global_op"], 0.65)

#     # approximate cheek width
#     face_w = abs(int(pts[CHEEK_RIGHT_CLUSTER[0]][0]) -
#                  int(pts[CHEEK_LEFT_CLUSTER[0]][0]))
#     accum = np.zeros(frame.shape[:2], dtype=np.float32)

#     for cluster, sign in [(CHEEK_LEFT_CLUSTER, -1), (CHEEK_RIGHT_CLUSTER, 1)]:
#         cp = pts[cluster]
#         cx = int(cp[:, 0].mean())
#         cy = int(cp[:, 1].mean())

#         if shape == "diagonal":
#             grad = radial_gradient(frame.shape, (cx, cy),
#                                    int(face_w * .40), int(face_w * .20), sign * 25)
#         elif shape == "sweep":
#             grad = radial_gradient(frame.shape, (cx, cy),
#                                    int(face_w * .26), int(face_w * .12), 0)
#         elif shape == "large":
#             r = int(face_w * .22)
#             grad = radial_gradient(frame.shape, (cx, cy), r, r, 0)
#         else:  # default "round"
#             grad = radial_gradient(frame.shape, (cx, cy),
#                                    int(face_w * .65), int(face_w * .35), sign * 8)
#         accum += grad

#     mask = np.clip(accum, 0, 1) * opacity
#     colour_layer = np.full_like(frame, colour, dtype=np.uint8)

#     return alpha_composite(frame, colour_layer, mask)


# def apply_eyeshadow(frame, pts):
#     """Soft‑light eyeshadow across lids + brows."""
#     if not state["show_shadow"]:
#         return frame
#     _, colour, base_op = EYESHADOW_SHADES[state["shadow_idx"]]
#     opacity = min(base_op * state["shadow_op"] * state["global_op"], 0.55)

#     mask = np.zeros(frame.shape[:2], dtype=np.float32)

#     for lid, brow in [(LID_LEFT, BROW_LEFT), (LID_RIGHT, BROW_RIGHT)]:
#         zone = np.concatenate([pts[lid], pts[brow]])
#         mask += feathered_poly_mask(frame.shape, zone, feather=8)

#     mask = np.clip(mask, 0, 1) * opacity
#     colour_layer = np.full_like(frame, colour, dtype=np.uint8)

#     return alpha_composite(frame, colour_layer, mask, blend_fn=soft_light_blend)


# def apply_eyeliner(frame, pts):
#     """Anti‑aliased poly‑line eyeliner."""
#     if not state["show_liner"]:
#         return frame
#     opacity = min(state["liner_op"] * state["global_op"], 1.0)

#     for eye in (EYE_LEFT, EYE_RIGHT):
#         eye_pts = pts[eye].reshape((-1, 1, 2)).astype(np.int32)
#         # draw on a temporary layer so we can blend with opacity
#         layer = np.zeros_like(frame)
#         cv2.polylines(layer, [eye_pts], isClosed=False,
#                       color=(20, 20, 20), thickness=2, lineType=cv2.LINE_AA)

#         # simple alpha blend (no special mode required)
#         mask = (layer != 0).any(axis=2).astype(np.float32) * opacity
#         frame = alpha_composite(frame, layer, mask)

#     return frame


# # ----------------------------------------------------------------------
# #  Camera thread – runs continuously until `running` is cleared
# # ----------------------------------------------------------------------
# running = threading.Event()
# running.set()


# def camera_loop():
#     """Capture, run detection, apply makeup, display."""
#     cap = cv2.VideoCapture(0)

#     while running.is_set() and cap.isOpened():
#         ok, frame = cap.read()
#         if not ok:
#             break

#         frame = cv2.flip(frame, 1)  # mirror selfie view

#         # ------------------------------------------------------------------
#         #  YOLO face detection → coarse bounding box
#         # ------------------------------------------------------------------
#         results = yolo(frame, verbose=False)
#         for box in results[0].boxes:
#             if float(box.conf) < 0.5:
#                 continue

#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             pad = 20
#             x1c = max(0, x1 - pad)
#             y1c = max(0, y1 - pad)
#             x2c = min(frame.shape[1], x2 + pad)
#             y2c = min(frame.shape[0], y2 + pad)

#             roi = frame[y1c:y2c, x1c:x2c]
#             mp_res = face_mesh.process(cv2.cvtColor(roi, cv2.COLOR_BGR2RGB))

#             if not mp_res.multi_face_landmarks:
#                 continue

#             for lm in mp_res.multi_face_landmarks:
#                 h, w, _ = roi.shape
#                 pts = (np.array([[pt.x * w, pt.y * h] for pt in lm.landmark])
#                        + [x1c, y1c]).astype(int)

#                 # ----------------------------------------------------------------
#                 #  Apply every enabled effect
#                 # ----------------------------------------------------------------
#                 if state["show_foundation"]:
#                     frame = apply_foundation(frame, pts)
#                 frame = apply_eyeshadow(frame, pts)
#                 frame = apply_blush(frame, pts)
#                 frame = apply_lipstick(frame, pts)
#                 frame = apply_eyeliner(frame, pts)

#         # --------------------------------------------------------------------
#         #  Show result
#         # --------------------------------------------------------------------
#         cv2.imshow("AR Makeup — Camera (press q to quit)", frame)

#         # Simple exit strategy – no keyboard shortcuts required.
#         if cv2.waitKey(1) & 0xFF == ord("q"):
#             running.clear()
#             break

#     cap.release()
#     cv2.destroyAllWindows()


# # ----------------------------------------------------------------------
# #  Tkinter UI – modular, dark‑theme, scrollable panel
# # ----------------------------------------------------------------------
# class MakeupPanel:
#     """Main control panel window."""

#     # ----- colour palette (mirrors globals.css) -----
#     BG = "#12121e"
#     CARD = "#1e1e30"
#     CARD2 = "#252538"
#     HDR = "#2a2a45"
#     FG = "#e8e8f0"
#     FG2 = "#7878a0"
#     ACCENT = "#ffd700"
#     GREEN = "#27ae60"
#     RED = "#c0392b"
#     BORDER = "#3a3a55"

#     SWATCH_R = 14          # radius of colour swatch
#     SWATCH_GAP = 34        # centre‑to‑centre spacing
#     COLS = 8               # max swatches per row

#     def __init__(self):
#         self.root = tk.Tk()
#         self.root.title("AR Makeup Studio – Controls")
#         self.root.configure(bg=self.BG)
#         self.root.geometry("340x760+1130+40")
#         self.root.resizable(False, True)
#         self.root.protocol('WM_DELETE_WINDOW', self._on_close)

#         self._toggle_labels = {}   # key → tk.Label
#         self._swatch_refs = {}     # key → dict (canvas, items, name_id, shades)

#         self._build_ui()
#         self.root.after(80, self._sync_loop)   # UI ↔ state sync

#     # ------------------------------------------------------------------
#     #  UI construction helpers
#     # ------------------------------------------------------------------
#     def _build_ui(self):
#         style = ttk.Style()
#         style.theme_use("clam")
#         style.configure(
#             "Dark.Vertical.TScrollbar",
#             background=self.HDR,
#             troughcolor=self.BG,
#             arrowcolor=self.FG2,
#             bordercolor=self.BG,
#         )

#         outer = tk.Frame(self.root, bg=self.BG)
#         outer.pack(fill="both", expand=True)

#         # Canvas + scrollbar for the whole panel
#         self._cv = tk.Canvas(outer, bg=self.BG, highlightthickness=0, bd=0)
#         sb = ttk.Scrollbar(
#             outer,
#             orient="vertical",
#             command=self._cv.yview,
#             style="Dark.Vertical.TScrollbar",
#         )
#         self._inner = tk.Frame(self._cv, bg=self.BG)
#         self._win_id = self._cv.create_window(
#             (0, 0), window=self._inner, anchor="nw", width=312
#         )
#         self._inner.bind(
#             "<Configure>",
#             lambda e: self._cv.configure(scrollregion=self._cv.bbox("all")),
#         )
#         self._cv.configure(yscrollcommand=sb.set)
#         sb.pack(side="right", fill="y")
#         self._cv.pack(side="left", fill="both", expand=True)

#         # ----- Title bar -------------------------------------------------
#         self._title_bar()

#         # ----- Shade sections (foundation / lipstick / blush / eyeshadow) -
#         self._shade_section(
#             "FOUNDATION",
#             FOUNDATION_SHADES,
#             "foundation_idx",
#             ["A", "S", "D", "F", "G", "H"],
#             toggle_key="show_foundation",
#             desc="Smooth skin · tint tone",
#         )
#         self._shade_section(
#             "LIPSTICK",
#             LIP_SHADES,
#             "lip_idx",
#             ["1", "2", "3", "4", "5", "6", "7", "8"],
#             toggle_key="show_lip",
#             desc="Overlay blend – colour shows through",
#         )
#         self._shade_section(
#             "BLUSH",
#             BLUSH_SHADES,
#             "blush_idx",
#             ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Z", "X"],
#             toggle_key="show_blush",
#             desc="Soft‑light – follows cheekbones",
#         )
#         self._shade_section(
#             "EYESHADOW",
#             EYESHADOW_SHADES,
#             "shadow_idx",
#             ["Z", "X", "C", "V", "N", "M"],
#             toggle_key="show_shadow",
#             desc="Gradient from lid up to brow",
#         )
#         self._eyeliner_row()
#         self._opacity_section()
#         self._footer()

#         # propagate scroll events to canvas
#         self._bind_scroll_all(self._inner)

#     def _title_bar(self):
#         f = tk.Frame(self._inner, bg="#0d0d1a", pady=10)
#         f.pack(fill="x", pady=(0, 4))
#         tk.Label(
#             f,
#             text="AR MAKEUP STUDIO",
#             bg="#0d0d1a",
#             fg=self.ACCENT,
#             font=("Helvetica", 14, "bold"),
#         ).pack()
#         tk.Label(
#             f,
#             text="Virtual Try‑On  ·  v6",
#             bg="#0d0d1a",
#             fg=self.FG2,
#             font=("Helvetica", 8),
#         ).pack(pady=(2, 0))

#     # ------------------------------------------------------------------
#     #  Generic shade card builder (used for foundation / lip / blush / shadow)
#     # ------------------------------------------------------------------
#     def _shade_section(
#         self,
#         title: str,
#         shades,
#         state_key: str,
#         key_chars,
#         toggle_key: str | None = None,
#         desc: str = "",
#     ):
#         card = tk.Frame(self._inner, bg=self.CARD, highlightthickness=1, highlightbackground=self.BORDER)
#         card.pack(fill="x", padx=6, pady=(0, 6))

#         # Header with optional toggle
#         hdr = tk.Frame(card, bg=self.HDR, pady=5)
#         hdr.pack(fill="x")
#         tk.Label(hdr, text=title, bg=self.HDR, fg=self.ACCENT, font=("Helvetica", 10, "bold")).pack(side="left", padx=8)

#         if toggle_key:
#             is_on = state.get(toggle_key, True)
#             tog = tk.Label(
#                 hdr,
#                 text="  ON  " if is_on else "  OFF ",
#                 bg=self.GREEN if is_on else self.RED,
#                 fg="white",
#                 font=("Helvetica", 8, "bold"),
#                 cursor="hand2",
#                 padx=2,
#                 pady=1,
#             )
#             tog.pack(side="right", padx=8)
#             tog.bind("<Button-1>", lambda e, k=toggle_key: self._toggle_state(k))
#             self._toggle_labels[toggle_key] = tog

#         # Swatch canvas
#         n = len(shades)
#         cols = min(self.COLS, n)
#         rows = (n + cols - 1) // cols
#         pad_top = 20
#         row_h = self.SWATCH_R * 2 + 10
#         name_h = 20
#         canvas_h = pad_top + rows * row_h + name_h + 6

#         sc = tk.Canvas(card, bg=self.CARD2, highlightthickness=0, width=290, height=canvas_h)
#         sc.pack(fill="x", padx=0, pady=0)

#         items = {}
#         for i, entry in enumerate(shades):
#             col_i = i % cols
#             row_i = i // cols
#             cx = 18 + col_i * self.SWATCH_GAP
#             cy = pad_top + self.SWATCH_R + row_i * row_h + 2

#             # colour handling – entry format can be (name, bgr) or (name, bgr, …)
#             bgr = entry[1]
#             hex_c = bgr_to_hex(bgr)
#             lum = luminance(bgr)
#             txt_c = "#ffffff" if lum < 140 else "#222222"

#             # invisible gold ring for active shade (drawn later)
#             ring = sc.create_oval(
#                 cx - self.SWATCH_R - 4,
#                 cy - self.SWATCH_R - 4,
#                 cx + self.SWATCH_R + 4,
#                 cy + self.SWATCH_R + 4,
#                 outline="",
#                 width=0,
#                 fill="",
#             )
#             # actual colour circle
#             cid = sc.create_oval(
#                 cx - self.SWATCH_R,
#                 cy - self.SWATCH_R,
#                 cx + self.SWATCH_R,
#                 cy + self.SWATCH_R,
#                 fill=hex_c,
#                 outline=self.BORDER,
#                 width=1,
#             )

#             items[i] = (cid, ring, cx, cy)

#             # Bind click → select shade
#             for tag in (cid, ring):
#                 sc.tag_bind(tag, "<Button-1>", lambda e, idx=i, sk=state_key: self._pick_shade(sk, idx))

#             # Hover highlight (gold outline)
#             sc.tag_bind(cid, "<Enter>", lambda e, c=cid, s=sc: s.itemconfig(c, outline=self.ACCENT, width=2))
#             sc.tag_bind(cid, "<Leave>", lambda e, c=cid, s=sc, idx=i, sk=state_key:
#                          s.itemconfig(c,
#                                       outline=self.ACCENT if state[sk] == idx else self.BORDER,
#                                       width=2 if state[sk] == idx else 1))

#         # Active shade name (bottom of canvas)
#         name_y = pad_top + rows * row_h + name_h - 4
#         name_id = sc.create_text(8, name_y, anchor="w", text=shades[state[state_key]][0],
#                                  fill=self.ACCENT, font=("Helvetica", 9, "bold"))

#         if desc:
#             tk.Label(card, text=desc, bg=self.CARD, fg=self.FG2, font=("Helvetica", 8)).pack(anchor="w", padx=8, pady=(2, 6))
#         else:
#             tk.Frame(card, bg=self.CARD, height=4).pack()

#         self._swatch_refs[state_key] = {
#             "canvas": sc,
#             "items": items,
#             "name_id": name_id,
#             "shades": shades,
#         }

#     def _eyeliner_row(self):
#         card = tk.Frame(self._inner, bg=self.CARD, highlightthickness=1, highlightbackground=self.BORDER)
#         card.pack(fill="x", padx=6, pady=(0, 6))

#         hdr = tk.Frame(card, bg=self.HDR, pady=5)
#         hdr.pack(fill="x")
#         tk.Label(hdr, text="EYELINER", bg=self.HDR, fg=self.ACCENT, font=("Helvetica", 10, "bold")).pack(side="left", padx=8)

#         is_on = state["show_liner"]
#         tog = tk.Label(
#             hdr,
#             text="  ON  " if is_on else "  OFF ",
#             bg=self.GREEN if is_on else self.RED,
#             fg="white",
#             font=("Helvetica", 8, "bold"),
#             cursor="hand2",
#             padx=2,
#             pady=1,
#         )
#         tog.pack(side="right", padx=8)
#         tog.bind("<Button-1>", lambda e: self._toggle_state("show_liner"))
#         self._toggle_labels["show_liner"] = tog

#         tk.Label(
#             card,
#             text="Classic polylines – follows upper lash line",
#             bg=self.CARD,
#             fg=self.FG2,
#             font=("Helvetica", 8),
#         ).pack(anchor="w", padx=8, pady=(4, 6))

#     # ------------------------------------------------------------------
#     #  Opacity sliders card
#     # ------------------------------------------------------------------
#     def _opacity_section(self):
#         card = tk.Frame(self._inner, bg=self.CARD, highlightthickness=1, highlightbackground=self.BORDER)
#         card.pack(fill="x", padx=6, pady=(0, 6))

#         hdr = tk.Frame(card, bg=self.HDR, pady=5)
#         hdr.pack(fill="x")
#         tk.Label(hdr, text="OPACITY SCALERS", bg=self.HDR, fg=self.ACCENT,
#                  font=("Helvetica", 10, "bold")).pack(side="left", padx=8)

#         style = ttk.Style()
#         style.configure(
#             "Makeup.Horizontal.TScale",
#             background=self.CARD2,
#             troughcolor=self.HDR,
#             slidercolor=self.ACCENT,
#         )

#         # Mapping of slider label → state key
#         sliders = [
#             ("Global", "global_op", 0.0, 1.5, ".2f"),
#             ("Foundation", "foundation_op", 0.0, 1.0, ".2f"),
#             ("Lipstick", "lip_op", 0.0, 1.0, ".2f"),
#             ("Blush", "blush_op", 0.0, 1.0, ".2f"),
#             ("Eyeshadow", "shadow_op", 0.0, 1.0, ".2f"),
#             ("Eyeliner", "liner_op", 0.0, 1.0, ".2f"),
#         ]

#         for label, key, lo, hi, fmt in sliders:
#             row = tk.Frame(card, bg=self.CARD2)
#             row.pack(fill="x", padx=8, pady=4)

#             tk.Label(row, text=label, bg=self.CARD2, fg=self.FG,
#                      font=("Helvetica", 9), width=11,
#                      anchor="w").pack(side="left")

#             var = tk.DoubleVar(value=state[key])
#             sld = ttk.Scale(row, from_=lo, to=hi, variable=var,
#                             orient="horizontal", length=160,
#                             style="Makeup.Horizontal.TScale")
#             sld.pack(side="left", padx=6)

#             val_lbl = tk.Label(row, text=format(state[key], fmt),
#                                bg=self.CARD2, fg=self.ACCENT,
#                                font=("Helvetica", 9, "bold"), width=5)
#             val_lbl.pack(side="left")

#             # Update logic – reacts to drag and release
#             def _on_change(event, k=key, v=var, l=val_lbl, f=fmt):
#                 new_val = round(v.get(), 3)
#                 state[k] = new_val
#                 l.config(text=format(new_val, f))

#             sld.bind("<Motion>", _on_change)
#             sld.bind("<ButtonRelease-1>", _on_change)

#     def _footer(self):
#         f = tk.Frame(self._inner, bg="#0d0d1a", pady=8)
#         f.pack(fill="x", pady=(4, 0))
#         for txt in [
#             "Click swatches to select",
#             "Scroll this panel with mouse wheel",
#             "Close the camera window or press ‘q’ to quit",
#         ]:
#             tk.Label(f, text=txt, bg="#0d0d1a", fg=self.FG2,
#                      font=("Helvetica", 8)).pack()

#     # ------------------------------------------------------------------
#     #  Interaction helpers (toggles, shade picking, UI refresh)
#     # ------------------------------------------------------------------
#     def _toggle_state(self, key: str):
#         state[key] = not state[key]
#         self._refresh_toggle(key)

#     def _refresh_toggle(self, key: str):
#         if key not in self._toggle_labels:
#             return
#         lbl = self._toggle_labels[key]
#         is_on = state.get(key, False)
#         lbl.config(text="  ON  " if is_on else "  OFF ",
#                    bg=self.GREEN if is_on else self.RED)

#     def _pick_shade(self, state_key: str, idx: int):
#         state[state_key] = idx
#         # Special case: selecting a foundation should automatically enable it
#         if state_key == "foundation_idx":
#             state["show_foundation"] = True
#             self._refresh_toggle("show_foundation")
#         self._refresh_swatches(state_key)

#     def _refresh_swatches(self, key: str):
#         if key not in self._swatch_refs:
#             return
#         ref = self._swatch_refs[key]
#         sc = ref["canvas"]
#         items = ref["items"]
#         active = state[key]
#         shades = ref["shades"]

#         sc.itemconfig(ref["name_id"], text=shades[active][0])

#         for i, (cid, ring, cx, cy) in items.items():
#             if i == active:
#                 sc.itemconfig(ring, outline=self.ACCENT, width=3, fill="")
#                 sc.itemconfig(cid, outline=self.ACCENT, width=2)
#             else:
#                 sc.itemconfig(ring, outline="", width=0, fill="")
#                 sc.itemconfig(cid, outline=self.BORDER, width=1)

#     # ------------------------------------------------------------------
#     #  Scroll handling (mouse wheel, trackpad, Linux wheel events)
#     # ------------------------------------------------------------------
#     def _bind_scroll_all(self, widget):
#         widget.bind("<MouseWheel>", lambda e: self._cv.yview_scroll(-1 * (e.delta // 120), "units"))
#         widget.bind("<Button-4>", lambda e: self._cv.yview_scroll(-1, "units"))
#         widget.bind("<Button-5>", lambda e: self._cv.yview_scroll(1, "units"))
#         for child in widget.winfo_children():
#             self._bind_scroll_all(child)

#     def _on_close(self):
#         running.clear()
#         self.root.destroy()
        
#     # ------------------------------------------------------------------
#     #  UI ↔ state sync (called repeatedly)
#     # ------------------------------------------------------------------
#     def _sync_loop(self):
#         # Refresh toggles / swatches in case external code mutates `state`.
#         for k in self._toggle_labels:
#             self._refresh_toggle(k)
#         for k in self._swatch_refs:
#             self._refresh_swatches(k)
#         self.root.after(200, self._sync_loop)

#     # ------------------------------------------------------------------
#     #  Public entry point
#     # ------------------------------------------------------------------
#     def run(self):
#         self.root.mainloop()


# # ----------------------------------------------------------------------
# #  Main entry point – start GUI + camera thread
# # ----------------------------------------------------------------------
# if __name__ == "__main__":
#     # launch camera in background
#     cam_thread = threading.Thread(target=camera_loop, daemon=True, name="CameraThread")
#     cam_thread.start()

#     # launch Tkinter panel (blocks until window closed)
#     panel = MakeupPanel()
#     panel.run()

#     # When the panel is closed, cleanly shut down the camera thread
#     running.clear()
#     cam_thread.join(timeout=2)
