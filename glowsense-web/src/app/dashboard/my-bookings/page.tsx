"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, AlertCircle, MapPin, CreditCard, Star, UserCheck, ArrowUpRight } from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import RatingModal from "@/components/rating/RatingModal";
import StandbyModal from "@/components/standby/StandbyModal";
import DifferencePaymentModal from "@/components/payment/DifferencePaymentModal";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface Booking {
  id: number;
  provider: {
    id: number;
    full_name: string;
    business_name: string;
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
  paid_amount?: string;
  refunded_amount?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "confirmed" | "completed" | "cancelled" | "cancelled_by_provider" | "standby_pending" | "awaiting_extra_payment">("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<Record<number, { isRated: boolean; canRate: boolean }>>({});
  const [showStandbyModal, setShowStandbyModal] = useState(false);
  const [standbyProviders, setStandbyProviders] = useState<Array<{id:number;full_name:string;business_name:string|null;city:string|null;level:string;average_rating:number}>>([]);
  const [standbyBookingId, setStandbyBookingId] = useState<number | null>(null);
  const [showDiffPaymentModal, setShowDiffPaymentModal] = useState(false);
  const [diffPaymentBooking, setDiffPaymentBooking] = useState<Booking | null>(null);
  const { showAlert, showConfirm } = useCustomAlert();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "customer") {
      router.push("/login/customer");
      return;
    }
    
    fetchBookings();
  }, []);

  useEffect(() => {
    // Check rating status for completed bookings
    const completedBookings = bookings.filter(b => b.status === "completed");
    completedBookings.forEach(booking => {
      checkRatingStatus(booking.id);
    });
  }, [bookings]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const res = await fetch("http://localhost:8000/customer/bookings", {
        headers: getAuthHeaders(),
      });
      
      console.log("Response status:", res.status, res.statusText);
      
      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await res.json();
            console.error("Error response (JSON):", errorData);
            // Handle empty object case
            if (Object.keys(errorData).length === 0) {
              errorMessage = `HTTP ${res.status}: ${res.statusText}. Empty response from server.`;
            } else {
              errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData) || errorMessage;
            }
          } catch (jsonError) {
            console.error("Failed to parse JSON error:", jsonError);
            errorMessage = `HTTP ${res.status}: ${res.statusText}. Could not parse error response.`;
          }
        } else {
          // Response is not JSON, try to get text
          try {
            const text = await res.text();
            console.error("Error response (text):", text);
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.error("Could not read error response:", textError);
            errorMessage = `HTTP ${res.status}: ${res.statusText}. Could not read error response.`;
          }
        }
        
        // Special handling for common status codes
        if (res.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          router.push("/login/customer");
        } else if (res.status === 404) {
          errorMessage = "Customer not found. Please contact support.";
        } else if (res.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        console.error(`Failed to fetch bookings - Status: ${res.status}, Message: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      console.error("Failed to fetch bookings", err);
      // Show error to user
      showAlert(`Failed to fetch bookings: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRatingStatus = async (bookingId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/ratings/booking/${bookingId}/check`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRatingStatus(prev => ({
          ...prev,
          [bookingId]: {
            isRated: data.is_rated,
            canRate: data.can_rate,
          }
        }));
      }
    } catch (err) {
      console.error("Failed to check rating status", err);
    }
  };

  const openStandbyModal = async (bookingId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/standby/providers/${bookingId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStandbyProviders(data.standby_providers || []);
        setStandbyBookingId(bookingId);
        setShowStandbyModal(true);
      } else {
        showAlert("Failed to load standby providers");
      }
    } catch (err) {
      console.error(err);
      showAlert("An error occurred");
    }
  };

  const cancelBooking = async (bookingId: number) => {
    if (!(await showConfirm("Are you sure you want to cancel this booking?"))) return;
    try {
      const res = await fetch(`http://localhost:8000/customer/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to cancel booking");
      }
      fetchBookings();
    } catch (err: any) {
      console.error("Failed to cancel booking", err);
      showAlert(err.message || "Failed to cancel booking");
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
      case "rejected":
        return "bg-red-100 text-red-700";
      case "cancelled_by_provider":
        return "bg-orange-100 text-orange-700";
      case "standby_selected":
      case "standby_pending":
        return "bg-indigo-100 text-indigo-700";
      case "refunded":
        return "bg-emerald-100 text-emerald-700";
      case "awaiting_extra_payment":
        return "bg-amber-100 text-amber-700";
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
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "cancelled_by_provider":
        return <AlertCircle className="h-4 w-4" />;
      case "standby_selected":
      case "standby_pending":
        return <UserCheck className="h-4 w-4" />;
      case "refunded":
        return <DollarSign className="h-4 w-4" />;
      case "awaiting_extra_payment":
        return <ArrowUpRight className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">View and manage your service bookings</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["all", "pending", "accepted", "confirmed", "completed", "cancelled", "cancelled_by_provider", "standby_pending", "awaiting_extra_payment"] as const).map((status) => (
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
          <p className="text-muted-foreground mb-4">You don't have any {filter === "all" ? "" : filter} bookings yet.</p>
          <Button onClick={() => router.push("/dashboard/providers")}>
            Browse Service Providers
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{booking.service.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{booking.provider.business_name}</span>
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
                    <div className="mt-2 space-y-1">
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
                      {booking.paid_amount && (
                        <p className="text-xs text-muted-foreground">
                          💰 Paid: <span className="font-medium text-foreground">${parseFloat(booking.paid_amount).toFixed(2)}</span>
                        </p>
                      )}
                      {booking.refunded_amount && parseFloat(booking.refunded_amount) > 0 && (
                        <p className="text-xs text-emerald-600">
                          ↩️ Refunded: <span className="font-medium">${parseFloat(booking.refunded_amount).toFixed(2)}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending / Accepted Actions */}
              {booking.status === "pending" && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => cancelBooking(booking.id)}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                </div>
              )}
              {booking.payment_status !== "paid" && booking.status === "accepted" && (
                <div className="pt-4 border-t border-border flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                  <Button
                    onClick={() => cancelBooking(booking.id)}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              {booking.status === "confirmed" && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => cancelBooking(booking.id)}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking (Refundable)
                  </Button>
                </div>
              )}

              {/* Standby Pending Info */}
              {booking.status === "standby_pending" && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 bg-indigo-50 px-4 py-3 rounded-lg mb-3">
                    <UserCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-indigo-800">Waiting for standby provider to accept</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Once they accept, you'll be able to pay their service price.</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => cancelBooking(booking.id)}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                </div>
              )}

              {/* Awaiting Extra Payment */}
              {booking.status === "awaiting_extra_payment" && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 bg-amber-50 px-4 py-3 rounded-lg mb-3">
                    <ArrowUpRight className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Additional Payment Required</p>
                      <p className="text-xs text-amber-600 mt-0.5">The standby provider's rate is higher. Pay the difference to confirm.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setDiffPaymentBooking(booking);
                        setShowDiffPaymentModal(true);
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      size="sm"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Difference
                    </Button>
                    <Button
                      onClick={() => cancelBooking(booking.id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Standby Options Button */}
              {booking.status === "cancelled_by_provider" && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => openStandbyModal(booking.id)}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    View Standby Options / Request Refund
                  </Button>
                </div>
              )}

              {/* Rating Button - Only show for completed bookings when filter is "completed" */}
              {booking.status === "completed" && filter === "completed" && (
                <div className="pt-4 border-t border-border">
                  {ratingStatus[booking.id]?.isRated ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>You've already rated this service</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowRatingModal(true);
                      }}
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate This Service
                    </Button>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {selectedBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBooking(null);
            fetchBookings(); // Refresh bookings after payment
          }}
          bookingId={selectedBooking.id}
          amount={parseFloat(selectedBooking.service.price.split("-")[0].trim().replace("$", "").replace(",", ""))}
          serviceName={selectedBooking.service.name}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedBooking(null);
            fetchBookings(); // Refresh to show updated payment status
          }}
        />
      )}

      {/* Rating Modal */}
      {selectedBooking && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          serviceName={selectedBooking.service.name}
          providerName={selectedBooking.provider.business_name || selectedBooking.provider.full_name}
          onSuccess={() => {
            fetchBookings(); // Refresh to show updated rating status
            if (selectedBooking) {
              checkRatingStatus(selectedBooking.id);
            }
          }}
        />
      )}

      {/* Standby Modal */}
      {standbyBookingId && (
        <StandbyModal
          isOpen={showStandbyModal}
          onClose={() => {
            setShowStandbyModal(false);
            setStandbyBookingId(null);
            setStandbyProviders([]);
          }}
          bookingId={standbyBookingId}
          providers={standbyProviders}
          onSelectProvider={() => {
            fetchBookings();
          }}
          onRequestRefund={() => {
            fetchBookings();
          }}
        />
      )}

      {/* Difference Payment Modal */}
      {diffPaymentBooking && (
        <DifferencePaymentModal
          isOpen={showDiffPaymentModal}
          onClose={() => {
            setShowDiffPaymentModal(false);
            setDiffPaymentBooking(null);
          }}
          bookingId={diffPaymentBooking.id}
          serviceName={diffPaymentBooking.service.name}
          onSuccess={() => {
            setShowDiffPaymentModal(false);
            setDiffPaymentBooking(null);
            fetchBookings();
            showAlert("Payment confirmed! Your booking is now confirmed.");
          }}
        />
      )}

    </div>
  );
}

