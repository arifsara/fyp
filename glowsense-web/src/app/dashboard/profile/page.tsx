"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, X, Briefcase, Loader2 } from "lucide-react";
import ProviderLevelBadge from "@/components/rating/ProviderLevelBadge";
import SignupLocation from "@/components/signup/SignupLocation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    location: "",
    businessName: "",
    bio: "",
    profilePhoto: "",
    level: "",
    levelInfo: null as { name: string; color: string; icon: string } | null,
    // Customer preferences
    skinType: "",
    categories: [] as string[],
    budgetRange: "",
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const currentRole = localStorage.getItem("role");
    setRole(currentRole);

    if (!token) {
      router.push(currentRole === "provider" ? "/login/provider" : "/login/customer");
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
      const currentRole = localStorage.getItem("role");
      if (currentRole === "provider") {
        const res = await fetch(`${API_URL}/provider/profile`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfileData({
          fullName: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
          location: "",
          businessName: data.business_name || "",
          bio: data.bio || "",
          profilePhoto: data.profile_photo || data.profile_picture || "",
          level: data.level || "",
          levelInfo: data.level_info || null,
          skinType: "",
          categories: [],
          budgetRange: "",
        });
      } else if (currentRole === "customer") {
        const res = await fetch(`${API_URL}/customer/profile`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfileData({
          fullName: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: "",
          location: data.location || "",
          businessName: "",
          bio: "",
          profilePhoto: data.profile_picture || "",
          level: "",
          levelInfo: null,
          skinType: data.skin_type || "",
          categories: data.categories || [],
          budgetRange: data.budget_range || "",
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
      const uploadRes = await fetch(`${API_URL}/upload/profile`, {
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

      // Update profile with photo URL based on the role
      const currentRole = localStorage.getItem("role");
      const endpoint = currentRole === "provider"
        ? `${API_URL}/provider/profile/photo`
        : `${API_URL}/customer/profile/photo`;

      const updateRes = await fetch(endpoint, {
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
      const currentRole = localStorage.getItem("role");

      if (currentRole === "provider") {
        // Update provider profile information
        const res = await fetch(`${API_URL}/provider/profile`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            full_name: profileData.fullName,
            phone: profileData.phone,
            city: profileData.city,
            business_name: profileData.businessName,
            bio: profileData.bio,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to update profile");
        }
      } else if (currentRole === "customer") {
        // Update customer profile information including preferences
        const res = await fetch(`${API_URL}/customer/profile`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            full_name: profileData.fullName,
            phone: profileData.phone,
            location: profileData.location,
            skin_type: profileData.skinType,
            categories: profileData.categories,
            budget_range: profileData.budgetRange,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to update profile");
        }
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate password
    if (!passwordData.newPassword || !passwordData.newPassword.trim()) {
      setError("New password is required");
      setLoading(false);
      return;
    }

    const passwordClean = passwordData.newPassword.trim();
    if (passwordClean.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    // Check for at least one special character
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(passwordClean)) {
      setError("Password must contain at least one special character");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/provider/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setShowChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = useCallback((location: string) => {
    setProfileData((prev) => ({ ...prev, city: location }));
  }, []);

  const displayPhoto = previewUrl || (profileData.profilePhoto
    ? (profileData.profilePhoto.startsWith('http')
      ? profileData.profilePhoto
      : `${API_URL}${profileData.profilePhoto}`)
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
                placeholder="Enter your full name"
              />
              {profileData.fullName && (
                <p className="text-xs text-muted-foreground">Current: {profileData.fullName}</p>
              )}
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
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Enter 11-digit phone number"
              />
              {profileData.phone && (
                <p className="text-xs text-muted-foreground">Current: {profileData.phone}</p>
              )}
            </div>
            {role === "provider" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Location (City)</Label>
                <SignupLocation
                  onLocationChange={handleLocationChange}
                  value={profileData.city}
                  required={false}
                />
                {profileData.city && (
                  <p className="text-xs text-muted-foreground">Current location: {profileData.city}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Location (City)</Label>
                <SignupLocation
                  onLocationChange={(location) => setProfileData({ ...profileData, location })}
                  value={profileData.location}
                  required={false}
                />
                {profileData.location && (
                  <p className="text-xs text-muted-foreground">Current location: {profileData.location}</p>
                )}
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={profileData.businessName}
                onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                placeholder="Enter your business name"
              />
              {profileData.businessName && (
                <p className="text-xs text-muted-foreground">Current: {profileData.businessName}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio / About</Label>
              <textarea
                id="bio"
                className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about your expertise, experience, and services..."
              />
              {profileData.bio && (
                <p className="text-xs text-muted-foreground">Current bio: {profileData.bio.length} characters</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
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

        {/* Preferences Card - Only for Customers */}
        {role === "customer" && (
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold border-b pb-4">Preferences</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="skinType">Skin Type</Label>
                <select
                  id="skinType"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={profileData.skinType}
                  onChange={(e) => setProfileData({ ...profileData, skinType: e.target.value })}
                >
                  <option value="">Select skin type</option>
                  <option value="Normal">Normal</option>
                  <option value="Oily">Oily</option>
                  <option value="Dry">Dry</option>
                  <option value="Combination">Combination</option>
                  <option value="Sensitive">Sensitive</option>
                </select>
                {profileData.skinType && (
                  <p className="text-xs text-muted-foreground">Current: {profileData.skinType}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Category Preferences</Label>
                <div className="space-y-3">
                  {["Skincare", "Haircare", "Makeup"].map((category) => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileData({
                              ...profileData,
                              categories: [...profileData.categories, category],
                            });
                          } else {
                            setProfileData({
                              ...profileData,
                              categories: profileData.categories.filter((c) => c !== category),
                            });
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
                {profileData.categories.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {profileData.categories.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="budgetRange">Budget Range</Label>
                <select
                  id="budgetRange"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={profileData.budgetRange}
                  onChange={(e) => setProfileData({ ...profileData, budgetRange: e.target.value })}
                >
                  <option value="">Select budget range</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
                {profileData.budgetRange && (
                  <p className="text-xs text-muted-foreground">Current: {profileData.budgetRange}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Card */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
          <h2 className="text-xl font-semibold border-b pb-4">Account Security</h2>
          <div className="space-y-4">
            {!showChangePassword ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-start"
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Change Password</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setError("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password (min 6 chars, 1 special char)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </div>
            )}
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

