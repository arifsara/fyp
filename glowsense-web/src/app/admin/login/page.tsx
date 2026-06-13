"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
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
      const res = await fetch("http://localhost:8000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(errorData.detail || "Invalid admin credentials");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", "admin");
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 py-12 px-4 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">System Admin</h2>
          <p className="mt-2 text-slate-400">Restricted access portal</p>
        </div>

        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="adminglowsense@gmail.com"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:ring-red-500"
                value={formData.email}
                required
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-slate-300">Security Password</Label>
              <Input
                id="password"
                type="password"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:ring-red-500"
                value={formData.password}
                required
                onChange={handleChange}
              />
            </div>

            <Button
              className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20"
              type="submit"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Identity"}
            </Button>
          </form>

          <div className="text-center pt-4">
            <Link href="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="mr-2 h-3 w-3" /> Back to Public Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
