"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, ImagePlus, X, Loader2, ScanFace, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Condition {
  label: string;
  display: string;
  score: number;
  rank: number;
}

interface AnalysisResult {
  analysis_id: number;
  conditions: Condition[];
  created_at: string;
}

interface SkinAnalysisUploaderProps {
  onResult: (result: AnalysisResult) => void;
  onError: (msg: string) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type Mode = "initial" | "upload" | "camera" | "preview";

export default function SkinAnalysisUploader({
  onResult,
  onError,
}: SkinAnalysisUploaderProps) {
  const [mode, setMode] = useState<Mode>("initial");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Cleanup logic ---
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // --- File Handling ---
  const handleFile = useCallback((f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      onError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      onError("Image must be under 10 MB.");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setMode("preview");
  }, [onError]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  // --- Camera Logic ---
  const startCamera = async () => {
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      onError("Could not access camera. Please check permissions.");
      setMode("initial");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
          handleFile(capturedFile);
          stopStream();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const clearSelection = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setMode("initial");
    stopStream();
    if (fileRef.current) fileRef.current.value = "";
  };

  // --- API Call ---
  const handleAnalyze = async () => {
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      onError("You must be logged in to run an analysis.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BACKEND_URL}/skin/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail ?? `Server error ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      onResult(data);
      clearSelection();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Initial State: Two Action Buttons */}
      {mode === "initial" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("upload")}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Upload Image</p>
              <p className="text-xs text-muted-foreground mt-1">Select from your device</p>
            </div>
          </button>

          <button
            onClick={startCamera}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Camera Access</p>
              <p className="text-xs text-muted-foreground mt-1">Take a real-time photo</p>
            </div>
          </button>
        </div>
      )}

      {/* 2. Upload Mode */}
      {mode === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-16 px-6
            ${dragOver
              ? "border-primary bg-primary/8 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-primary/3"
            }`}
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <ImagePlus className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Drop your photo here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP · max 10 MB
            </p>
          </div>
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 rounded-full" onClick={(e) => { e.stopPropagation(); setMode("initial"); }}>
            <X className="h-4 w-4" />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* 3. Camera Mode */}
      {mode === "camera" && (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isStreaming ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Starting camera...</p>
            </div>
          )}

          {isStreaming && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60"
                onClick={() => { stopStream(); setMode("initial"); }}
              >
                <X className="h-5 w-5" />
              </Button>
              
              <button
                onClick={capturePhoto}
                className="h-16 w-16 rounded-full border-4 border-white bg-primary/80 hover:bg-primary transition-all active:scale-95 shadow-lg"
              />

              <div className="w-10" /> {/* Spacer to balance */}
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* 4. Preview Mode (After selection/capture) */}
      {mode === "preview" && preview && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-md aspect-video sm:aspect-auto sm:max-h-80 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected skin photo"
              className="w-full h-full object-contain mx-auto"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
               <p className="text-white text-xs font-medium flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                Image Ready: {file?.name ?? "Captured Photo"}
               </p>
            </div>
          </div>

          <div className="flex gap-3">
             <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={clearSelection}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              
              <Button
                className="flex-[2] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl shadow-md shadow-primary/20 transition-all duration-200"
                disabled={loading}
                onClick={handleAnalyze}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <ScanFace className="mr-2 h-4 w-4" />
                    Run AI Analysis
                  </>
                )}
              </Button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-center text-xs text-muted-foreground animate-pulse">
          DermLIP is calculating your skin scores — please wait…
        </p>
      )}
    </div>
  );
}

// Internal icon for the preview state
function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
