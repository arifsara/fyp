"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle, Clock, User, DollarSign, History, Loader2, AlertTriangle, UserCheck } from "lucide-react";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface Booking {
  id: number;
  customer: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
  };
  service: {
    id: number;
    name: string;
    price: string;
  };
  booking_date: string;
  status: string;
  notes?: string;
  created_at: string;
  payment_status?: string;
}

interface Payment {
  id: number;
  booking_id: number;
  amount: string;
  currency: string;
  status: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
  stripe_payment_intent_id?: string;
  service?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "confirmed" | "completed" | "cancelled" | "cancelled_by_provider" | "standby_pending">("all");
  const { showAlert, showConfirm } = useCustomAlert();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "provider") {
      router.push("/login/provider");
      return;
    }
    
    fetchBookings();
    fetchPayments();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/provider/bookings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch(`${API_URL}/provider/payments`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/provider/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update booking");
      }
      fetchBookings(); // Refresh list
      fetchPayments(); // Refresh payments
    } catch (err: any) {
      console.error("Failed to update booking", err);
      showAlert(err.message || "Failed to update booking status");
    }
  };

  const cancelWithStandby = async (bookingId: number) => {
    if (!(await showConfirm("Are you sure you want to cancel this booking? The customer will be offered standby providers."))) return;
    try {
      const res = await fetch(`${API_URL}/standby/provider/cancel-booking/${bookingId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to cancel booking");
      }
      const data = await res.json();
      showAlert(`Booking cancelled. ${data.standby_providers?.length || 0} standby provider(s) found for the customer.`);
      fetchBookings();
      fetchPayments();
    } catch (err: any) {
      console.error("Failed to cancel booking", err);
      showAlert(err.message || "Failed to cancel booking");
    }
  };

  const respondToStandby = async (bookingId: number, action: "accept" | "reject") => {
    const confirmMsg = action === "accept"
      ? "Accept this standby booking? The customer will pay your service price."
      : "Reject this standby booking? The customer will be able to pick another provider.";
    if (!(await showConfirm(confirmMsg))) return;
    try {
      const res = await fetch(`${API_URL}/standby/provider/respond`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ booking_id: bookingId, action }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Failed to ${action} booking`);
      }
      const data = await res.json();
      showAlert(data.message);
      fetchBookings();
      fetchPayments();
    } catch (err: any) {
      console.error(`Failed to ${action} standby booking`, err);
      showAlert(err.message || `Failed to ${action} booking`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-purple-100 text-purple-700";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-700";
      case "cancelled_by_provider":
        return "bg-orange-100 text-orange-700";
      case "standby_pending":
        return "bg-indigo-100 text-indigo-700";
      case "awaiting_extra_payment":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Bookings Management</h1>
        <p className="text-muted-foreground">Manage bookings made by customers. Accept bookings to allow customers to make payment.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["all", "pending", "accepted", "confirmed", "completed", "cancelled", "cancelled_by_provider", "standby_pending"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              filter === status
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">You don't have any {filter === "all" ? "" : filter} bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{booking.service.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{booking.customer.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${booking.service.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(booking.booking_date).toLocaleString()}</span>
                    </div>
                  </div>
                  {booking.notes && (
                    <p className="text-sm text-muted-foreground mt-2">Notes: {booking.notes}</p>
                  )}
                  {booking.payment_status && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.payment_status === "RELEASED_TO_PROVIDER" 
                          ? "bg-green-100 text-green-700" 
                          : booking.payment_status === "HELD_IN_ESCROW"
                          ? "bg-yellow-100 text-yellow-700"
                          : booking.payment_status === "REFUNDED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        Payment: {booking.payment_status}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Customer: {booking.customer.email} | {booking.customer.phone}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {booking.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() => updateBookingStatus(booking.id, "accepted")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, "rejected")}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
              {booking.status === "accepted" && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Waiting for customer payment...</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, "cancelled_by_provider")}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
              {booking.status === "confirmed" && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateBookingStatus(booking.id, "completed")}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelWithStandby(booking.id)}
                    className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cancel Booking (Standby)
                  </Button>
                </div>
              )}
              {booking.status === "standby_pending" && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3 bg-indigo-50 px-3 py-2 rounded-lg">
                    <UserCheck className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm text-indigo-700 font-medium">Standby booking request — A customer selected you as a replacement provider</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToStandby(booking.id, "accept")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Standby
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToStandby(booking.id, "reject")}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment History Section */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Payment History</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
          >
            {showPaymentHistory ? "Hide" : "Show"} History
          </Button>
        </div>

        {showPaymentHistory && (
          <>
            {loadingPayments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading payments...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {payment.service?.name || "Service"}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === "succeeded"
                                ? "bg-green-100 text-green-700"
                                : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : payment.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        {payment.customer && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <User className="h-3 w-3" />
                            <span>{payment.customer.full_name} ({payment.customer.email})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {payment.paid_at
                                ? new Date(payment.paid_at).toLocaleDateString()
                                : new Date(payment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {payment.payment_method && (
                            <span className="capitalize">{payment.payment_method}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span>{parseFloat(payment.amount).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {payment.currency.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    {payment.stripe_payment_intent_id && (
                      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        Payment ID: {payment.stripe_payment_intent_id.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
