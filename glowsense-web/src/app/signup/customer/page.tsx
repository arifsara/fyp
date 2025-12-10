"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, ArrowLeft } from "lucide-react";
import SignupLocation from "@/components/signup/SignupLocation";

export default function CustomerSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", location: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleLocationChange = useCallback((location: string) => {
    setFormData((prev) => ({ ...prev, location }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate name (only letters and spaces, no numbers or special characters)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!formData.name || !formData.name.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }
    if (!nameRegex.test(formData.name.trim())) {
      setError("Name should only contain letters and spaces (no numbers or special characters)");
      setLoading(false);
      return;
    }

    // Validate phone number (11 digits, numeric only)
    const phoneRegex = /^\d+$/;
    if (!formData.phone || !formData.phone.trim()) {
      setError("Phone number is required");
      setLoading(false);
      return;
    }
    const phoneClean = formData.phone.trim().replace(/[\s-()]/g, ""); // Remove common formatting
    if (!phoneRegex.test(phoneClean)) {
      setError("Phone number should contain only numeric values");
      setLoading(false);
      return;
    }
    if (phoneClean.length !== 11) {
      setError("Phone number must be exactly 11 digits");
      setLoading(false);
      return;
    }

    // Validate password
    if (!formData.password || !formData.password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    const passwordClean = formData.password.trim();
    if (passwordClean.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    // Check for at least one special character
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(passwordClean)) {
      setError("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const phoneClean = formData.phone.trim().replace(/[\s-()]/g, "");
      
      const signupData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.name.trim(),
        phone: phoneClean,
        location: formData.location || null
      };

      console.log("Signup attempt:", { ...signupData, password: "***" }); // Debug log

      const res = await fetch("http://localhost:8000/signup/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });
      
      const data = await res.json();
      console.log("Signup response:", res.status, data); // Debug log
      
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Signup failed");
      }

      router.push("/login/customer");
    } catch (err: any) {
      console.error("Signup error:", err); // Debug log
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pink-50/50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <User className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create Customer Account</h2>
          <p className="mt-2 text-muted-foreground">Join for free personalized beauty insights</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-pink-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" required onChange={handleChange} />
            </div>
            <SignupLocation
              onLocationChange={handleLocationChange}
              value={formData.location}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm</Label>
                <Input id="confirmPassword" type="password" required onChange={handleChange} />
              </div>
            </div>

            <Button className="w-full h-12 text-lg mt-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login/customer" className="font-semibold text-primary hover:underline">Log in</Link>
            </p>
            <Link href="/signup" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mt-4">
              <ArrowLeft className="mr-2 h-3 w-3" /> Switch Role
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

