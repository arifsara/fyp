"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  Briefcase, 
  Video, 
  Image as ImageIcon,
  Clock,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingItem {
  id: number;
  customer_name: string;
  customer_email: string;
  service_name: string;
  booking_date: string;
  status: string;
  booking_status: string | null;
  payment_status: string;
  created_at: string;
}

interface ProviderDetails {
  provider: {
    id: number;
    full_name: string;
    business_name: string;
    email: string;
    phone: string;
    city: string;
    bio: string;
    level: string;
  };
  portfolio_items: any[];
  services: any[];
}

export default function AdminProviderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"portfolio" | "services" | "history">("history");

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      // 1. Fetch Portfolio & Services
      const detailsRes = await fetch(`${API_URL}/providers/${id}`);
      if (detailsRes.ok) {
        const data = await detailsRes.json();
        setDetails(data);
      }

      // 2. Fetch History specifically for this provider
      const bookingsRes = await fetch(`${API_URL}/admin/bookings?provider_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Error fetching provider data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = status?.toLowerCase() || "pending";
    const colors: any = {
      confirmed: "bg-emerald-100 text-emerald-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-rose-100 text-rose-800",
      cancelled_by_provider: "bg-rose-100 text-rose-800",
      pending: "bg-slate-100 text-slate-800",
      accepted: "bg-indigo-100 text-indigo-800",
      standby_pending: "bg-amber-100 text-amber-800",
    };
    return colors[s] || "bg-slate-100 text-slate-800";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Gathering complete information...</p>
      </div>
    );
  }

  if (!details) return <div className="p-8 text-center">Provider not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/admin/dashboard")}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Provider Dossier</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <Card className="border-none shadow-sm mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="h-24 w-24 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold flex-shrink-0">
                {details.provider.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-extrabold text-slate-900">{details.provider.full_name}</h1>
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-tighter">
                    {details.provider.level} Level
                  </span>
                </div>
                <p className="text-xl text-slate-500 mb-4 font-medium">{details.provider.business_name}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" /> {details.provider.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" /> {details.provider.phone || "No phone"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" /> {details.provider.city || "Unknown City"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-slate-200/50 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Booking History
          </button>
          <button 
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "portfolio" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Portfolio
          </button>
          <button 
            onClick={() => setActiveTab("services")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "services" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Services
          </button>
        </div>

        {/* Content Area */}
        <Card className="border-none shadow-sm overflow-hidden min-h-[500px]">
          <CardContent className="p-0">
            {activeTab === "history" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.length > 0 ? bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{b.customer_name}</p>
                          <p className="text-xs text-slate-500">{b.customer_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{b.service_name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(b.booking_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(b.booking_status || b.status)}`}>
                            {(b.booking_status || b.status).replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                          {b.payment_status}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No booking records found for this provider</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="p-8">
                {details.portfolio_items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {details.portfolio_items.map((item) => (
                      <div key={item.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                        {item.image_url ? (
                          <div className="aspect-video relative overflow-hidden bg-slate-200">
                             <img 
                              src={item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center bg-slate-200">
                            <ImageIcon className="h-8 w-8 text-slate-400" />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-bold text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">No portfolio content uploaded</div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="p-8">
                {details.services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.services.map((s) => (
                      <div key={s.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-slate-900">{s.name}</h4>
                          <span className="text-blue-600 font-bold">${s.price}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{s.description}</p>
                        <div className="flex gap-4 text-xs font-medium text-slate-400">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration}</div>
                          <div className="flex items-center gap-1 uppercase tracking-wider">{s.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">No services cataloged yet</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
