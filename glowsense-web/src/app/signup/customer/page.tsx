"use client";
import { API_URL } from "@/lib/api";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, ArrowLeft } from "lucide-react";
import SignupLocation from "@/components/signup/SignupLocation";
import { GoogleAuthButton } from "@/components/GOOGLE AUTH/GoogleAuthButton";
import { useSession } from "next-auth/react";

export default function CustomerSignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", location: "" });
  const [emailLocked, setEmailLocked] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleLocationChange = useCallback((location: string) => {
    setFormData((prev) => ({ ...prev, location }));
  }, []);

  useEffect(() => {
    // Handle redirect from Google. If the user already exists in the backend, we should automatically authenticate them.
    const handleGoogleSignupAuth = async () => {
      if (status === "authenticated" && session && (session as any).id_token) {
        
        // Let's attempt to use it specifically as a login intent first just in case they're already registered
        try {
          const res = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_token: (session as any).id_token,
              role: "customer",
              intent: "signup",  // intent "signup" returns `already_registered` boolean
            }),
          });
          
          if (res.ok) {
             const data = await res.json();
             
             // If already registered, seamlessly log them in and redirect to dashboard
             if (data.already_registered) {
                // To get the token we need to re-ping with login intent
                const loginRes = await fetch(`${API_URL}/auth/google`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id_token: (session as any).id_token,
                    role: "customer",
                    intent: "login",
                  }),
                });
                
                if (loginRes.ok) {
                   const loginData = await loginRes.json();
                   if (loginData.access_token) {
                     localStorage.setItem("token", loginData.access_token);
                     localStorage.setItem("role", "customer");
                     router.push("/dashboard");
                     return;
                   }
                }
             }
          }
        } catch(e) { /* ignore and fallback to normal prefills */ }

        // If not registered, just prefill email/name
        setFormData((prev) => ({
          ...prev,
          email: session.user?.email || "",
          name: session.user?.name || prev.name,
        }));
        setEmailLocked(true);
      }
    };
    
    handleGoogleSignupAuth();

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const emailStr = params.get("email");
    const from = params.get("from");
    const nameStr = params.get("name");
    if (emailStr && from === "google") {
      setFormData((prev) => ({
        ...prev,
        email: emailStr,
        name: nameStr || prev.name,
      }));
      setEmailLocked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

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

      const res = await fetch(`${API_URL}/signup/customer`, {
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
              <Input id="name" value={formData.name} required onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                disabled={emailLocked}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={formData.phone} required onChange={handleChange} />
            </div>
            <SignupLocation
              onLocationChange={handleLocationChange}
              value={formData.location}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} required onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} required onChange={handleChange} />
              </div>
            </div>

            <Button className="w-full h-12 text-lg mt-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4">
            <GoogleAuthButton
              role="customer"
              intent="signup"
              text="Continue with Google"
            />
          </div>

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

