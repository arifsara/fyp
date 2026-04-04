"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Star, 
  Users, 
  UserCheck, 
  MessageSquare, 
  TrendingUp,
  Search,
  Calendar,
  LogOut,
  ShieldCheck,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminRatingItem {
  id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_id: number;
  customer_name: string | null;
  customer_email: string | null;
  provider_id: number;
  provider_name: string | null;
  provider_email: string | null;
  provider_business: string | null;
  service_id: number;
  service_name: string | null;
}

interface ProviderItem {
  id: number;
  full_name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  level: string;
  bookings_count: number;
  ratings_count: number;
  average_rating: number;
}

interface CustomerItem {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  bookings_count: number;
}

interface BookingItem {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  provider_id: number;
  provider_name: string;
  provider_business: string;
  provider_email: string;
  service_id: number;
  service_name: string;
  service_price: string;
  time_slot_id: number | null;
  slot_date: string | null;
  booking_date: string;
  status: string;
  booking_status: string | null;
  payment_status: string;
  original_time_slot: string | null;
  created_at: string;
}

interface AdminStats {
  total_ratings: number;
  average_rating: number;
  total_providers: number;
  total_customers: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feedback" | "providers" | "customers" | "bookings">("feedback");
  
  const [stats, setStats] = useState<AdminStats>({
    total_ratings: 0,
    average_rating: 0,
    total_providers: 0,
    total_customers: 0
  });
  
  const [ratings, setRatings] = useState<AdminRatingItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRatings(),
      fetchProviders(),
      fetchCustomers(),
      fetchBookings()
    ]);
    setLoading(false);
  };

  const fetchRatings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/admin/ratings/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          total_ratings: data.total_ratings,
          average_rating: data.average_rating,
          total_providers: data.total_providers,
          total_customers: data.total_customers
        });
        setRatings(data.ratings);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

  const fetchProviders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/admin/providers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/admin/customers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm("Are you sure you want to remove this service provider? All their services, portfolio, and bookings will be deleted.")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/admin/provider/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Provider removed successfully");
        fetchInitialData(); // Refresh everything
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to remove provider");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/admin/login");
  };

  const filteredRatings = ratings.filter(r => {
    const matchesSearch = 
      r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.provider_business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const ratingDate = new Date(r.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    
    const matchesDate = (!start || ratingDate >= start) && (!end || ratingDate <= end);
    return matchesSearch && matchesDate;
  });

  const filteredProviders = providers.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.provider_business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status can be in either 'status' or 'booking_status'
    const currentStatus = b.booking_status || b.status;
    const matchesStatus = bookingStatusFilter === "all" || currentStatus === bookingStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeConfig = (status: string | null) => {
    const s = status?.toLowerCase() || "pending";
    switch(s) {
      case 'confirmed': return "bg-emerald-100 text-emerald-800";
      case 'completed': return "bg-blue-100 text-blue-800";
      case 'cancelled':
      case 'cancelled_by_provider': return "bg-rose-100 text-rose-800";
      case 'accepted': return "bg-indigo-100 text-indigo-800";
      case 'standby_pending': return "bg-amber-100 text-amber-800";
      case 'awaiting_extra_payment': return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-red-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Securing access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-600 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">GlowSense <span className="text-red-600">Admin</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500">System Administrator</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="h-4 w-4 mr-2" /> Log Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">System Management</h1>
            <p className="text-slate-500 mt-1">Manage users, providers, and monitor platform activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchInitialData} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
              <TrendingUp className="h-4 w-4 mr-2" /> Refresh Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-white hover:ring-1 hover:ring-blue-100 transition-all cursor-pointer" onClick={() => setActiveTab("feedback")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Ratings</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_ratings}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Platform Score</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.average_rating} <span className="text-sm text-slate-400 font-normal">/ 5.0</span></h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                  <Star className="h-6 w-6 fill-current" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:ring-1 hover:ring-emerald-100 transition-all cursor-pointer" onClick={() => setActiveTab("providers")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Service Providers</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_providers}</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <UserCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:ring-1 hover:ring-purple-100 transition-all cursor-pointer" onClick={() => setActiveTab("customers")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Registered Customers</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_customers}</h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-slate-200/50 rounded-xl w-fit">
          <button 
            onClick={() => {setActiveTab("feedback"); setSearchTerm("");}}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "feedback" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Feedback
          </button>
          <button 
            onClick={() => {setActiveTab("providers"); setSearchTerm("");}}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "providers" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Service Providers
          </button>
          <button 
            onClick={() => {setActiveTab("customers"); setSearchTerm("");}}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "customers" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Customers
          </button>
          <button 
            onClick={() => {setActiveTab("bookings"); setSearchTerm("");}}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "bookings" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All Bookings
          </button>
        </div>

        {/* Table Rendering */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-6">
            <CardTitle className="text-lg font-bold text-slate-800">
              {activeTab === "feedback" && "Member Ratings & Feedback"}
              {activeTab === "providers" && "Manage Service Providers"}
              {activeTab === "customers" && "Registered Customer Database"}
              {activeTab === "bookings" && "Comprehensive Booking Tracker"}
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={`Search ${activeTab}...`} 
                  className="pl-9 bg-white border-slate-200 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {activeTab === "feedback" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 text-slate-600">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs h-9 focus:outline-none"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="mx-1 text-slate-300">to</span>
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-xs h-9 focus:outline-none"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  {(startDate || endDate) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {setStartDate(""); setEndDate("");}}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
              {activeTab === "bookings" && (
                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2">
                  <select 
                    className="bg-transparent border-none text-xs h-9 focus:outline-none font-medium text-slate-600"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled (Customer)</option>
                    <option value="cancelled_by_provider">Cancelled (Provider)</option>
                    <option value="standby_pending">Standby Pending</option>
                    <option value="awaiting_extra_payment">Awaiting Payment</option>
                  </select>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* FEEDBACK VIEW */}
                {activeTab === "feedback" && (
                  <>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Service Provider</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Message</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRatings.length > 0 ? filteredRatings.map((rating) => (
                        <tr key={rating.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{rating.customer_name || "N/A"}</p>
                            <p className="text-xs text-slate-500">{rating.customer_email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{rating.provider_business || rating.provider_name || "N/A"}</p>
                            <p className="text-xs text-slate-500">{rating.provider_email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < rating.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} 
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm text-slate-700 italic">
                              {rating.comment ? `"${rating.comment}"` : <span className="text-slate-400">N/A</span>}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-slate-500">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <EmptyState message="No ratings found" />
                      )}
                    </tbody>
                  </>
                )}

                {/* PROVIDERS VIEW */}
                {activeTab === "providers" && (
                  <>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Provider / Business</th>
                        <th className="px-6 py-4">Contact Info</th>
                        <th className="px-6 py-4">City</th>
                        <th className="px-6 py-4">Stats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProviders.length > 0 ? filteredProviders.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                {p.full_name?.charAt(0)}
                              </div>
                              <div 
                                className="cursor-pointer group"
                                onClick={() => router.push(`/admin/provider/${p.id}`)}
                              >
                                <p className="font-bold text-slate-900 group-hover:text-blue-600 group-hover:underline transition-all">{p.business_name || p.full_name}</p>
                                <p className="text-xs text-slate-400 capitalize">{p.level} Level</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-xs text-slate-600">
                                <Mail className="h-3 w-3 mr-1.5" /> {p.email}
                              </div>
                              <div className="flex items-center text-xs text-slate-600">
                                <Phone className="h-3 w-3 mr-1.5" /> {p.phone || "No phone"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-xs text-slate-600">
                              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" /> {p.city || "Unknown"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-xs font-bold text-slate-900">{p.bookings_count}</p>
                                <p className="text-[10px] text-slate-400 tracking-tight">Bookings</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-slate-900">{p.average_rating}</p>
                                <p className="text-[10px] text-slate-400 tracking-tight">Rating</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <EmptyState message="No service providers found" />
                      )}
                    </tbody>
                  </>
                )}

                {/* CUSTOMERS VIEW */}
                {activeTab === "customers" && (
                  <>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Full Name</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Bookings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.length > 0 ? filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                {c.full_name?.charAt(0)}
                              </div>
                              <div 
                                className="cursor-pointer group"
                                onClick={() => router.push(`/admin/customer/${c.id}`)}
                              >
                                <p className="font-bold text-slate-900 group-hover:text-blue-600 group-hover:underline transition-all">{c.full_name}</p>
                                <p className="text-xs text-slate-400">View Dossier</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.email}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.phone || "—"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.city || "—"}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                              {c.bookings_count} Bookings
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <EmptyState message="No customers registered yet" />
                      )}
                    </tbody>
                  </>
                )}
                  {/* BOOKINGS VIEW */}
                  {activeTab === "bookings" && (
                  <>
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Provider / Service</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.length > 0 ? filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{b.customer_name}</p>
                            <p className="text-xs text-slate-500">{b.customer_email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{b.service_name}</p>
                            <p className="text-xs text-slate-500">{b.provider_business || b.provider_name}</p>
                            <p className="text-[10px] text-slate-400">{b.service_price}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="flex flex-col">
                              <span className="font-medium">{new Date(b.slot_date || b.booking_date).toLocaleDateString()}</span>
                              <span className="text-xs text-slate-400">{new Date(b.slot_date || b.booking_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeConfig(b.booking_status || b.status)}`}>
                              {(b.booking_status || b.status).replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold ${b.payment_status === 'RELEASED_TO_PROVIDER' ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {b.payment_status}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <EmptyState message="No matching bookings found" />
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">{message}</p>
      </td>
    </tr>
  );
}
