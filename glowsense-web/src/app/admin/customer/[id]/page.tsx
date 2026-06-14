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
  User,
  History,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerDetails {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  bookings_count: number;
  created_at: string;
}

interface BookingItem {
  id: number;
  provider_name: string;
  provider_business: string;
  service_name: string;
  booking_date: string;
  status: string;
  booking_status: string | null;
  payment_status: string;
  created_at: string;
}

export default function AdminCustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);

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
      // 1. Fetch Profile Details
      const detailsRes = await fetch(`${API_URL}/admin/customer/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (detailsRes.ok) {
        const data = await detailsRes.json();
        setDetails(data);
      }

      // 2. Fetch specific History
      const bookingsRes = await fetch(`${API_URL}/admin/bookings?customer_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
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

  if (!details) return <div className="p-8 text-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/admin/dashboard")}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> All Customers
          </Button>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Customer Insight</div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Profile Card */}
        <Card className="border-none shadow-md overflow-hidden bg-white mb-10">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="bg-purple-600 md:w-64 p-10 flex flex-col items-center justify-center text-white">
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <User size={48} />
                </div>
                <h2 className="text-2xl font-black text-center leading-tight">{details.full_name}</h2>
                <span className="text-purple-100 text-xs font-bold uppercase mt-2 opacity-70">Member since {new Date(details.created_at || Date.now()).getFullYear()}</span>
              </div>
              
              <div className="flex-1 p-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Email</p>
                      <p className="text-slate-900 font-bold">{details.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Phone</p>
                      <p className="text-slate-900 font-bold">{details.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Location</p>
                      <p className="text-slate-900 font-bold">{details.city || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Activity</p>
                      <p className="text-slate-900 font-bold">{details.bookings_count} Total Bookings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-lg">
                <History className="h-5 w-5 text-white" />
             </div>
             <h2 className="text-2xl font-black text-slate-900">Service Journey</h2>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-tighter">
                  <tr>
                    <th className="px-8 py-5">Service Provider</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Booking Status</th>
                    <th className="px-8 py-5 text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.length > 0 ? bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                         <p className="font-bold text-slate-900">{b.service_name}</p>
                         <p className="text-xs text-slate-400 font-medium">{b.provider_business || b.provider_name}</p>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">
                        {new Date(b.booking_date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(b.booking_status || b.status)}`}>
                          {(b.booking_status || b.status).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded">
                           {b.payment_status}
                         </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">No history available for this customer</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
