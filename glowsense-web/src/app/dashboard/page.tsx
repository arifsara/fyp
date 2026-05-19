"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Image as ImageIcon, Briefcase, Clock, User, CheckCircle, XCircle, AlertCircle, Edit, Save, X, Camera } from "lucide-react";
import Link from "next/link";
import ProviderLevelBadge from "@/components/rating/ProviderLevelBadge";

interface Service {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: string;
  duration: string;
  is_active: boolean;
}

interface Booking {
  id: number;
  service_id: number;
  provider_id?: number;
  booking_date: string;
  status: string;
  notes?: string;
  customer?: {
    full_name: string;
    email: string;
  };
  provider?: {
    id: number;
    full_name: string;
    business_name: string;
    email: string;
  };
  service?: {
    id: number;
    name: string;
    price: string;
    category?: string;
  };
}

interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
}

interface DashboardData {
  provider?: {
    id: number;
    name: string;
    business_name: string;
    email: string;
    bio?: string;
    city?: string;
    phone?: string;
    profile_picture?: string;
    profile_photo?: string;
    level?: string;
    level_info?: {
      name: string;
      color: string;
      icon: string;
    };
    stripe_account_id?: string | null;
    stripe_onboarding_complete?: boolean;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profile_picture?: string;
    skin_type?: string;
    categories?: string[];
    budget_range?: string;
  };
  services?: Service[];
  bookings: Booking[];
  portfolio_items?: PortfolioItem[];
  stats: {
    total_services?: number;
    total_bookings: number;
    pending_bookings?: number;
    portfolio_items_count?: number;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [payoutSetupLoading, setPayoutSetupLoading] = useState(false);
  const [payoutSetupUrl, setPayoutSetupUrl] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem("role");
    setRole(currentRole);
    fetchDashboardData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const handleCreatePayoutLink = async () => {
    setPayoutSetupLoading(true);
    try {
      const res = await fetch("http://localhost:8000/provider/stripe/account-link", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create Stripe payout link");
      }
      const data = await res.json();
      if (data.url) {
        setPayoutSetupUrl(data.url);
        window.location.href = data.url;
      }
    } catch (err: any) {
      setPayoutError(err.message || "Failed to start payout setup");
    } finally {
      setPayoutSetupLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const role = localStorage.getItem("role");
      if (!role) {
        setLoading(false);
        return;
      }

      const endpoint = role === "provider" 
        ? "http://localhost:8000/provider/dashboard"
        : "http://localhost:8000/customer/dashboard";
      
      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      setDashboardData(data);
      if (role === "provider" && data.provider) {
        setBioText(data.provider.bio || "");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await fetch("http://localhost:8000/provider/bio", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ bio: bioText }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update bio");
      }
      const data = await res.json();
      if (dashboardData && dashboardData.provider) {
        setDashboardData({
          ...dashboardData,
          provider: { ...dashboardData.provider, bio: data.bio }
        });
      }
      setEditingBio(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingBio(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Welcome to Dashboard!</h1>
          <p className="text-muted-foreground">Manage your beauty services and bookings.</p>
        </div>
      </div>
    );
  }

  const isProvider = role === "provider";
  const isCustomer = role === "customer";

  // Customer Dashboard
  if (isCustomer && dashboardData.customer) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
            {dashboardData.customer.profile_picture ? (
              <img 
                src={dashboardData.customer.profile_picture.startsWith('http') 
                  ? dashboardData.customer.profile_picture 
                  : `http://localhost:8000${dashboardData.customer.profile_picture}`}
                alt={dashboardData.customer.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`${dashboardData.customer.profile_picture ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
              <User className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Welcome back, {dashboardData.customer.name}!</h1>
            <p className="text-muted-foreground">{dashboardData.customer.location || "Manage your bookings and preferences"}</p>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Preferences</h2>
            <Link href="/dashboard/profile">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          </div>
          {dashboardData.customer.skin_type || dashboardData.customer.categories?.length || dashboardData.customer.budget_range ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.customer.skin_type ? (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Skin Type</p>
                  <p className="font-semibold">{dashboardData.customer.skin_type}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/30 border border-dashed">
                  <p className="text-sm text-muted-foreground mb-1">Skin Type</p>
                  <p className="text-sm text-muted-foreground">Not set</p>
                </div>
              )}
              {dashboardData.customer.categories && dashboardData.customer.categories.length > 0 ? (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Interests</p>
                  <p className="font-semibold">{dashboardData.customer.categories.join(", ")}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/30 border border-dashed">
                  <p className="text-sm text-muted-foreground mb-1">Interests</p>
                  <p className="text-sm text-muted-foreground">Not set</p>
                </div>
              )}
              {dashboardData.customer.budget_range ? (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Budget Range</p>
                  <p className="font-semibold">${dashboardData.customer.budget_range}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-muted/30 border border-dashed">
                  <p className="text-sm text-muted-foreground mb-1">Budget Range</p>
                  <p className="text-sm text-muted-foreground">Not set</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No preferences set yet. Click 'Edit' to add your preferences.</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                <p className="text-2xl font-bold">{dashboardData.stats.total_bookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <Link href="/dashboard/my-bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            {dashboardData.bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.bookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      booking.status === "pending" 
                        ? "border-yellow-500 bg-yellow-50/50 hover:bg-yellow-50" 
                        : booking.status === "confirmed"
                        ? "border-green-500 bg-green-50/50"
                        : booking.status === "completed"
                        ? "border-blue-500 bg-blue-50/50"
                        : booking.status === "cancelled"
                        ? "border-red-500 bg-red-50/50"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{booking.service?.name || "Service"}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.provider?.business_name || booking.provider?.full_name || "Provider"}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </div>
                    {booking.booking_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.booking_date).toLocaleDateString()} at {new Date(booking.booking_date).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Provider Dashboard
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
          {dashboardData.provider?.profile_picture || dashboardData.provider?.profile_photo ? (
            <img 
              src={(dashboardData.provider.profile_picture || dashboardData.provider.profile_photo)?.startsWith('http') 
                ? (dashboardData.provider.profile_picture || dashboardData.provider.profile_photo) 
                : `http://localhost:8000${dashboardData.provider.profile_picture || dashboardData.provider.profile_photo}`}
              alt={dashboardData.provider.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${dashboardData.provider?.profile_picture || dashboardData.provider?.profile_photo ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">Welcome back, {dashboardData.provider?.name}!</h1>
            {dashboardData.provider?.level && (
              <ProviderLevelBadge 
                level={dashboardData.provider.level} 
                levelInfo={dashboardData.provider.level_info}
                size="lg"
              />
            )}
          </div>
          <p className="text-muted-foreground">{dashboardData.provider?.business_name}</p>
          {/* Stripe payouts setup */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {dashboardData.provider?.stripe_onboarding_complete ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                Payouts enabled with Stripe
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreatePayoutLink}
                disabled={payoutSetupLoading}
              >
                {payoutSetupLoading ? "Redirecting to Stripe..." : "Setup Payouts"}
              </Button>
            )}
          </div>
          {payoutError && <div className="mt-2 text-xs text-red-500 bg-red-50 border border-red-200 p-2 rounded-md">{payoutError}</div>}
        </div>
      </div>

      {/* Bio Section */}
      {dashboardData.provider && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">About You</h2>
            {!editingBio && (
              <Button size="sm" variant="outline" onClick={() => setEditingBio(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Bio
              </Button>
            )}
          </div>
          {editingBio ? (
            <div className="space-y-4">
              <textarea
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell customers about your expertise, experience, and what makes you special..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBio} disabled={savingBio}>
                  <Save className="h-4 w-4 mr-1" />
                  {savingBio ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingBio(false); setBioText(dashboardData.provider?.bio || ""); }}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {dashboardData.provider.bio || "No bio added yet. Click 'Edit Bio' to add information about yourself."}
            </p>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {dashboardData.provider && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Services</p>
                <p className="text-2xl font-bold">{dashboardData.stats.total_services || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                <p className="text-2xl font-bold">{dashboardData.stats.total_bookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <Link href="/dashboard/bookings?filter=pending">
            <div className="bg-white rounded-2xl border-2 border-yellow-500 p-6 shadow-sm hover:bg-yellow-50/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Bookings</p>
                  <p className="text-2xl font-bold text-yellow-700">{dashboardData.stats.pending_bookings || 0}</p>
                  {dashboardData.stats.pending_bookings && dashboardData.stats.pending_bookings > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">Click to review</p>
                  )}
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </Link>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Portfolio Items</p>
                <p className="text-2xl font-bold">{dashboardData.stats.portfolio_items_count || 0}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      )}

      {dashboardData.provider && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Services Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Services</h2>
              <Link href="/dashboard/portfolio">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              {dashboardData.services && dashboardData.services.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No services registered yet</p>
                  <Link href="/dashboard/portfolio">
                    <Button>Add Your First Service</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.services?.slice(0, 5).map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold">{service.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="capitalize">{service.category}</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {service.price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {service.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.services && dashboardData.services.length > 5 && (
                    <Link href="/dashboard/portfolio">
                      <Button variant="ghost" className="w-full">View All Services</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              <Link href="/dashboard/bookings">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              {dashboardData.bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Show pending bookings first */}
                  {dashboardData.bookings
                    .sort((a, b) => {
                      if (a.status === "pending" && b.status !== "pending") return -1;
                      if (a.status !== "pending" && b.status === "pending") return 1;
                      return 0;
                    })
                    .map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`p-4 rounded-xl border-2 transition-colors ${
                        booking.status === "pending" 
                          ? "border-yellow-500 bg-yellow-50/50 hover:bg-yellow-50" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{booking.service?.name || "Service"}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {booking.customer?.full_name || "Customer"}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.booking_date).toLocaleDateString()} at {new Date(booking.booking_date).toLocaleTimeString()}
                      </p>
                      {booking.status === "pending" && (
                        <Link href="/dashboard/bookings">
                          <Button size="sm" variant="outline" className="mt-2 w-full text-yellow-700 border-yellow-500 hover:bg-yellow-100">
                            Review Booking
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Preview */}
      {dashboardData.provider && dashboardData.portfolio_items && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Portfolio Showcase</h2>
            <Link href="/dashboard/portfolio">
              <Button variant="outline" size="sm">Manage Portfolio</Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            {dashboardData.portfolio_items.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No portfolio items yet</p>
                <Link href="/dashboard/portfolio">
                  <Button>Add Portfolio Items</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {dashboardData.portfolio_items.map((item) => (
                  <div key={item.id} className="aspect-square rounded-xl overflow-hidden border border-border">
                    {item.image_url ? (
                      <img 
                        src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:8000${item.image_url}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
