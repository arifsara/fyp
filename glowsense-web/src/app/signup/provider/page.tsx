"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Loader2, ArrowLeft, Upload, X } from "lucide-react";

export default function ProviderSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ 
    name: "", businessName: "", email: "", phone: "", city: "", password: "", confirmPassword: "", 
    bio: "", cnicId: "", certificates: "", businessLicense: ""
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileUpload = async (file: File, type: "certificate" | "license") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:8000/upload/documents", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "File upload failed");
      }
      
      const data = await res.json();
      return data.url;
    } catch (err: any) {
      throw new Error(`Failed to upload ${type}: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Upload certificate and license files if provided
      let certificateUrl = formData.certificates;
      let licenseUrl = formData.businessLicense;

      if (certificateFile) {
        try {
          certificateUrl = await handleFileUpload(certificateFile, "certificate");
        } catch (uploadErr: any) {
          setError(`Certificate upload failed: ${uploadErr.message}`);
          setLoading(false);
          return;
        }
      }
      if (licenseFile) {
        try {
          licenseUrl = await handleFileUpload(licenseFile, "license");
        } catch (uploadErr: any) {
          setError(`License upload failed: ${uploadErr.message}`);
          setLoading(false);
          return;
        }
      }

      // Sign up provider
      const res = await fetch("http://localhost:8000/signup/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || undefined,
          full_name: formData.name,
          phone: formData.phone,
          business_name: formData.businessName,
          city: formData.city,
          bio: formData.bio,
          cnic_id: formData.cnicId,
          certificates: certificateUrl || formData.certificates,
          business_license: licenseUrl || formData.businessLicense
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", "provider");
      router.push("/dashboard/portfolio");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-purple-50/50 py-12 px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-4">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-purple-900">Create Expert Profile</h2>
          <p className="mt-2 text-muted-foreground">Start growing your beauty business today</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-purple-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" placeholder="e.g. Sarah's Salon" required onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" required onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City / Location</Label>
                <Input id="city" required onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About</Label>
              <textarea 
                id="bio"
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                placeholder="Tell us about your expertise..."
                onChange={handleChange}
              />
            </div>

            {/* CNIC/ID */}
            <div className="space-y-2">
              <Label htmlFor="cnicId">CNIC / ID Number</Label>
              <Input id="cnicId" placeholder="e.g. 12345-1234567-1" onChange={handleChange} />
            </div>

            {/* Certificates */}
            <div className="space-y-2">
              <Label>Certificates / Qualifications</Label>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Certificates (PDF/Image)</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setCertificateFile(e.target.files[0])}
                />
              </label>
              {certificateFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{certificateFile.name}</span>
                  <button type="button" onClick={() => setCertificateFile(null)} className="text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Input 
                id="certificates" 
                placeholder="Or enter certifications text (e.g. Certified Esthetician, 5 years experience)"
                onChange={handleChange}
              />
            </div>

            {/* Business License */}
            <div className="space-y-2">
              <Label htmlFor="businessLicense">Business License</Label>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload License (PDF/Image)</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setLicenseFile(e.target.files[0])}
                />
              </label>
              {licenseFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{licenseFile.name}</span>
                  <button type="button" onClick={() => setLicenseFile(null)} className="text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Input 
                id="businessLicense" 
                placeholder="Or enter license number"
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" onChange={handleChange} />
                <p className="text-xs text-muted-foreground">Optional if using Google sign-in</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" onChange={handleChange} />
              </div>
            </div>

            <Button className="w-full h-12 text-lg mt-2 bg-purple-600 hover:bg-purple-700" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up as Expert"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href="/login/provider" className="font-semibold text-purple-600 hover:underline">Log in</Link>
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
