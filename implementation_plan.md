# AR Try-On: Capture Button & Photo History

Save the AR-makeup composite as a photo, persist it in the database, and show a history gallery below the camera.

---

## How the Capture Will Work

The AR view is made of two layered elements:
- A **`<video>`** element (webcam feed, CSS-mirrored with `scaleX(-1)`)
- A **`<canvas>`** (`overlayRef`) with the makeup drawn on top (also CSS-mirrored)

To capture the final combined image:
1. Create a temporary **offscreen canvas** (640×480)
2. **Un-mirror** it with `ctx.scale(-1, 1)` and `ctx.translate(-width, 0)` so the saved photo looks natural (not flipped)
3. **Draw the video frame** onto it
4. **Draw the overlay canvas** on top
5. Call `canvas.toBlob()` to get a JPEG blob → upload to backend

---

## Proposed Changes

### Backend

---

#### [MODIFY] [models.py](file:///d:/fyp%20-%20Copy/backend/models.py)
Add a new SQLAlchemy model:

```python
class ARSnapshot(Base):
    __tablename__ = "ar_snapshots"
    id           = Column(Integer, primary_key=True, index=True)
    customer_id  = Column(Integer, ForeignKey("customers.id"), nullable=False)
    image_url    = Column(String, nullable=False)      # /uploads/ar-snapshots/uuid.jpg
    makeup_config = Column(Text, nullable=True)        # JSON string of active makeup settings
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    customer     = relationship("Customer")
```

---

#### [MODIFY] [main.py](file:///d:/fyp%20-%20Copy/backend/main.py)

**New endpoints to add (3 total):**

1. **`POST /upload/ar-snapshot`** – Accepts a multipart file + optional JSON makeup config.
   - Authenticates via `get_current_customer` dependency
   - Saves file to `uploads/ar-snapshots/`
   - Inserts a row into `ar_snapshots` table
   - Returns `{ id, image_url, created_at }`

2. **`GET /customer/ar-history`** – Returns paginated list of the current customer's snapshots.
   - Authenticates via `get_current_customer`
   - Returns `[{ id, image_url, makeup_config, created_at }, ...]`

3. **`DELETE /customer/ar-snapshot/{snapshot_id}`** – Deletes a single snapshot.
   - Authenticates via `get_current_customer`
   - Deletes the DB row and the file from disk

---

### Frontend

---

#### [MODIFY] [ar-try-on/page.tsx](file:///d:/fyp%20-%20Copy/glowsense-web/src/app/dashboard/ar-try-on/page.tsx)

**New state variables to add:**
```ts
const [capturing, setCapturing]   = useState(false);       // flash animation
const [snapshots, setSnapshots]   = useState<Snapshot[]>([]); // history list
const [historyLoading, setHistoryLoading] = useState(false);
```

**New `handleCapture()` function:**
```ts
const handleCapture = async () => {
  const video   = videoRef.current;
  const overlay = overlayRef.current;
  if (!video || !overlay) return;

  // 1. Composite video + makeup onto a fresh canvas (un-mirrored)
  const w = video.videoWidth  || 640;
  const h = video.videoHeight || 480;
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.save();
  ctx.scale(-1, 1);              // undo the CSS scaleX(-1) mirror
  ctx.translate(-w, 0);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.drawImage(overlay, 0, 0, w, h);
  ctx.restore();

  // 2. Upload blob to backend
  setCapturing(true);
  out.toBlob(async (blob) => {
    if (!blob) return;
    const form = new FormData();
    form.append("file", blob, "ar-snapshot.jpg");
    form.append("makeup_config", JSON.stringify({
      lip: LIP_SHADES[lipIdx].name,
      blush: BLUSH_SHADES[blushIdx].name,
      // ...etc
    }));
    await fetch("http://localhost:8000/upload/ar-snapshot", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    fetchHistory();        // refresh the gallery
    setTimeout(() => setCapturing(false), 600);
  }, "image/jpeg", 0.92);
};
```

**New `fetchHistory()` function** (calls `GET /customer/ar-history`)

**UI changes:**
- **📸 Capture button** overlaid on the camera view (bottom-center, only visible when `cameraReady && faceDetected`)
- **White flash animation** when capturing (`capturing` state → brief white overlay)
- **History grid section** below the camera, showing thumbnails in a scrollable row
- Each thumbnail has a ✕ delete button
- Timestamps shown on hover

---

## Data Flow Diagram

```
[Canvas composite]
     ↓ toBlob()
     ↓ FormData
POST /upload/ar-snapshot  →  saves file to disk  →  inserts into ar_snapshots table
                                                              ↓
GET /customer/ar-history  ←─────────────────────────── returns rows
     ↓
Frontend history gallery renders thumbnails
```

---

## Open Questions

> [!IMPORTANT]
> **Should the history be visible only to the customer (private), or also to the provider / admin?**
> Currently the plan is private (only the logged-in customer can see/delete their own snapshots).

> [!NOTE]
> **Should we also store the makeup settings as a label on the thumbnail?** (e.g. "Classic Red lip + Flamingo blush")
> The plan includes storing them as a JSON string in `makeup_config`. This can be shown as a tooltip or caption on the history card.

---

## Verification Plan

### Automated Tests
- Backend can be tested via `curl`:
  ```bash
  curl -X POST http://localhost:8000/upload/ar-snapshot \
    -H "Authorization: Bearer <token>" \
    -F "file=@test.jpg"
  ```

### Manual Verification
1. Open AR try-on, start camera, look at camera until face detected
2. Click 📸 Capture — white flash should appear, then thumbnail appears in history below
3. Refresh the page — history should still be there (persisted in DB)
4. Click ✕ on a thumbnail — it should disappear and file should be deleted
