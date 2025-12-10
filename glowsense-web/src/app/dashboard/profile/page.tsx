"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, X, Briefcase, Loader2 } from "lucide-react";
import ProviderLevelBadge from "@/components/rating/ProviderLevelBadge";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profilePhoto: "",
    level: "",
    levelInfo: null as { name: string; color: string; icon: string } | null,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token) {
      router.push(role === "provider" ? "/login/provider" : "/login/customer");
      return;
    }

    // Fetch current profile data
    fetchProfileData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchProfileData = async () => {
    try {
      const role = localStorage.getItem("role");
      if (role === "provider") {
        const res = await fetch("http://localhost:8000/provider/dashboard", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfileData({
          fullName: data.provider.name || "",
          email: data.provider.email || "",
          phone: data.provider.phone || "",
          profilePhoto: data.provider.profile_photo || data.provider.profile_picture || "",
          level: data.provider.level || "",
          levelInfo: data.provider.level_info || null,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setError("");
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Upload file
      const uploadRes = await fetch("http://localhost:8000/upload/profile", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.url;

      // Update provider profile with photo URL
      const updateRes = await fetch("http://localhost:8000/provider/profile/photo", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ profile_photo: photoUrl }),
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      setProfileData({ ...profileData, profilePhoto: photoUrl });
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccess("Profile photo updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Update profile information
      const res = await fetch("http://localhost:8000/provider/profile", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: profileData.fullName,
          phone: profileData.phone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayPhoto = previewUrl || (profileData.profilePhoto 
    ? (profileData.profilePhoto.startsWith('http') 
        ? profileData.profilePhoto 
        : `http://localhost:8000${profileData.profilePhoto}`)
    : null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">Profile Management</h1>
          {profileData.level && (
            <ProviderLevelBadge 
              level={profileData.level} 
              levelInfo={profileData.levelInfo || undefined}
              size="lg"
            />
          )}
        </div>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 text-sm">
          {success}
        </div>
      )}

      <div className="grid gap-8">
        {/* Personal Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-xl font-semibold border-b pb-4">Personal Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profileData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {displayPhoto ? (
                    <img 
                      src={displayPhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${displayPhoto ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                    <Briefcase className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="flex items-center justify-center w-full h-10 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  {selectedFile && (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handlePhotoUpload}
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-xl font-semibold border-b pb-4">Beauty Preferences</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skinType">Skin Type</Label>
              <Input id="skinType" placeholder="e.g. Dry, Oily, Combination" defaultValue="Combination" />
            </div>
            <div className="space-y-4 md:col-span-2">
               <Label>Interests</Label>
               <div className="flex flex-wrap gap-3">
                 {["Skincare", "Haircare", "Makeup", "Nail Art", "Spa"].map((interest) => (
                   <label key={interest} className="flex items-center gap-2 px-4 py-2 rounded-full border border-input hover:border-primary cursor-pointer bg-white has-[:checked]:bg-primary/5 has-[:checked]:border-primary has-[:checked]:text-primary transition-colors">
                     <input type="checkbox" className="accent-primary h-4 w-4" defaultChecked={["Skincare", "Makeup"].includes(interest)} />
                     <span className="text-sm font-medium">{interest}</span>
                   </label>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-xl font-semibold border-b pb-4">Account Security</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full sm:w-auto justify-start">
              Change Password
            </Button>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <div className="h-6 w-11 rounded-full bg-muted relative cursor-pointer transition-colors hover:bg-muted/80">
                 <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button className="min-w-[120px]" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

