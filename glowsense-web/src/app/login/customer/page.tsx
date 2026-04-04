"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, ArrowLeft } from "lucide-react";
import { GoogleAuthButton } from "@/components/GOOGLE AUTH/GoogleAuthButton";
import { useSession, signOut } from "next-auth/react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const googleAuthAttempted = useRef(false);

  // Handle Google OAuth session: contact backend, then redirect
  useEffect(() => {
    if (
      status === "authenticated" &&
      session &&
      (session as any).id_token &&
      !googleAuthAttempted.current
    ) {
      googleAuthAttempted.current = true;
      setGoogleLoading(true);
      setError("");

      const doGoogleLogin = async () => {
        try {
          const res = await fetch("http://localhost:8000/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_token: (session as any).id_token,
              role: "customer",
              intent: "login",
            }),
          });

          const data = await res.json().catch(() => ({}));

          if (data.access_token) {
            // User exists in DB → go straight to dashboard
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", "customer");
            await signOut({ redirect: false });
            router.push("/dashboard");
            return;
          }

          // User does NOT exist in DB → redirect to signup with email pre-filled
          await signOut({ redirect: false });
          const email = data.email || session.user?.email || "";
          const name = data.name || session.user?.name || "";
          const params = new URLSearchParams({ email, from: "google", name });
          router.push(`/signup/customer?${params.toString()}`);
        } catch (err: any) {
          console.error("[CustomerLogin] Google auth error:", err);
          await signOut({ redirect: false });
          if (session?.user?.email) {
            const params = new URLSearchParams({
              email: session.user.email,
              from: "google",
              name: session.user.name || "",
            });
            router.push(`/signup/customer?${params.toString()}`);
          } else {
            setError("Google login failed. Please try again.");
            setGoogleLoading(false);
          }
        }
      };

      doGoogleLogin();
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("http://localhost:8000/login/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", "customer");
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith("glowsense_chat_session_")) sessionStorage.removeItem(key);
      });
      router.push("/dashboard");
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please check if the backend server is running.");
      } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setError("Cannot connect to server. Please ensure the backend is running on http://localhost:8000");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Show a full-page loading screen while Google auth is being processed
  if (googleLoading || (status === "authenticated" && (session as any)?.id_token)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-pink-50/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Signing you in with Google...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pink-50/50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <User className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Login</h2>
          <p className="mt-2 text-muted-foreground">Welcome back to your beauty journey</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-pink-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} required onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={formData.password} required onChange={handleChange} autoComplete="new-password" />
            </div>

            <Button className="w-full h-12 text-lg" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login as Customer"}
            </Button>
          </form>

          <div className="mt-4">
            <GoogleAuthButton
              role="customer"
              intent="login"
              text="Sign in with Google"
            />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              New here? <Link href="/signup/customer" className="font-semibold text-primary hover:underline">Create account</Link>
            </p>
            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mt-4">
              <ArrowLeft className="mr-2 h-3 w-3" /> Switch Role
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
