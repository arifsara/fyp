"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Loader2, ArrowLeft } from "lucide-react";

export default function ProviderLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("http://localhost:8000/login/provider", {
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
      localStorage.setItem("role", "provider");
      router.push("/dashboard/portfolio");
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-purple-50/50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-4">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-purple-900">Expert Login</h2>
          <p className="mt-2 text-muted-foreground">Manage your business and clients</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-purple-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required onChange={handleChange} />
            </div>

            <Button className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login as Expert"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              New here? <Link href="/signup/provider" className="font-semibold text-purple-600 hover:underline">Join as Pro</Link>
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

