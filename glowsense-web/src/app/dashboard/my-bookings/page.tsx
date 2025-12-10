"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, AlertCircle, MapPin, CreditCard, Star } from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import RatingModal from "@/components/rating/RatingModal";
import CustomerStandbyModal from "@/components/standby/CustomerStandbyModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "confirmed" | "completed" | "cancelled">("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<Record<number, { isRated: boolean; canRate: boolean }>>({});
  const [showStandbyModal, setShowStandbyModal] = useState(false);
  const [showStandbyPrompt, setShowStandbyPrompt] = useState(false);
  const [cancelledBookingId, setCancelledBookingId] = useState<number | null>(null);
  const [pendingStandbyData, setPendingStandbyData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "customer") {
      router.push("/login/customer");
      return;
    }
    
    fetchBookings();
    // Check for pending standby requests on page load
    checkPendingStandbyRequest();
    
    // Set up polling to check for standby requests every 5 seconds
    const standbyPollInterval = setInterval(() => {
      checkPendingStandbyRequest();
    }, 5000);
    
    return () => {
      clearInterval(standbyPollInterval);
    };
  }, []);

  useEffect(() => {
    // Check rating status for completed bookings
    const completedBookings = bookings.filter(b => b.status === "completed");
    completedBookings.forEach(booking => {
      checkRatingStatus(booking.id);
    });
    
    // Check for pending standby requests when bookings change
    checkPendingStandbyRequest();
  }, [bookings]);
  
  const checkPendingStandbyRequest = async () => {
    try {
      const res = await fetch("http://localhost:8000/standby/customer/pending-request", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Standby request check:", data);
        if (data.has_pending_request && data.cancelled_booking_id) {
          if (data.needs_opt_in) {
            // Check if providers are available before showing opt-in prompt
            try {
              const providersRes = await fetch(
                `http://localhost:8000/standby/customer/available-providers?cancelled_booking_id=${data.cancelled_booking_id}`,
                { headers: getAuthHeaders() }
              );
              if (providersRes.ok) {
                const providersData = await providersRes.json();
                // Only show opt-in prompt if there are available providers
                if (providersData.available_providers && providersData.available_providers.length > 0) {
                  setPendingStandbyData(data);
                  setShowStandbyPrompt(true);
                } else {
                  // No providers available, don't show prompt
                  console.log("No available providers, not showing standby opt-in prompt");
                }
              }
            } catch (err) {
              console.error("Failed to check available providers:", err);
            }
          } else {
            // Already opted in, check if providers are available before showing modal
            try {
              const providersRes = await fetch(
                `http://localhost:8000/standby/customer/available-providers?cancelled_booking_id=${data.cancelled_booking_id}`,
                { headers: getAuthHeaders() }
              );
              if (providersRes.ok) {
                const providersData = await providersRes.json();
                // Only show modal if there are available providers
                if (providersData.available_providers && providersData.available_providers.length > 0) {
                  setCancelledBookingId(data.cancelled_booking_id);
                  setShowStandbyModal(true);
                } else {
                  // No providers available, don't show modal
                  console.log("No available providers, not showing standby modal");
                }
              }
            } catch (err) {
              console.error("Failed to check available providers:", err);
            }
          }
        } else if (!data.has_pending_request) {
          // Close modals if no pending request
          if (showStandbyModal) setShowStandbyModal(false);
          if (showStandbyPrompt) setShowStandbyPrompt(false);
        }
      } else {
        console.error("Failed to check standby request:", res.status, res.statusText);
      }
    } catch (err) {
      console.error("Failed to check standby request", err);
    }
  };

  const handleOptInToStandby = async () => {
    if (!pendingStandbyData?.cancelled_booking_id) return;
    
    try {
      const res = await fetch("http://localhost:8000/standby/customer/opt-in", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ cancelled_booking_id: pendingStandbyData.cancelled_booking_id }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setShowStandbyPrompt(false);
        
        // Check if providers are available before showing modal
        try {
          const providersRes = await fetch(
            `http://localhost:8000/standby/customer/available-providers?cancelled_booking_id=${pendingStandbyData.cancelled_booking_id}`,
            { headers: getAuthHeaders() }
          );
          if (providersRes.ok) {
            const providersData = await providersRes.json();
            // Only show modal if there are available providers
            if (providersData.available_providers && providersData.available_providers.length > 0) {
              setCancelledBookingId(pendingStandbyData.cancelled_booking_id);
              setShowStandbyModal(true);
            } else {
              // No providers available, don't show modal
              console.log("No available providers, not showing standby modal");
            }
          }
        } catch (err) {
          console.error("Failed to check available providers:", err);
        }
        
        setPendingStandbyData(null);
      } else {
        const errorData = await res.json();
        alert(`Failed to opt-in: ${errorData.detail || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Failed to opt-in to standby", err);
      alert(`Failed to opt-in: ${err.message || "Unknown error"}`);
    }
  };

  const handleDeclineStandby = () => {
    setShowStandbyPrompt(false);
    setPendingStandbyData(null);
  };

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
      alert(`Failed to fetch bookings: ${err.message || err}`);
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
        {(["all", "pending", "accepted", "confirmed", "completed", "cancelled"] as const).map((status) => (
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
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.payment_status === "paid" 
                          ? "bg-green-100 text-green-700" 
                          : booking.payment_status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        Payment: {booking.payment_status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Button */}
              {booking.payment_status !== "paid" && booking.status === "accepted" && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowPaymentModal(true);
                    }}
                    className="w-full"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
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

      {/* Standby Support Opt-in Prompt */}
      <Dialog open={showStandbyPrompt} onOpenChange={setShowStandbyPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Standby Support Available</DialogTitle>
            <DialogDescription>
              Your booking was cancelled. Would you like to use our automated standby support to find available service providers in the same category and city?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleOptInToStandby}
              className="flex-1"
            >
              Yes, Show Available Providers
            </Button>
            <Button
              variant="outline"
              onClick={handleDeclineStandby}
              className="flex-1"
            >
              No, Thanks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standby Support Modal */}
      {cancelledBookingId && (
        <CustomerStandbyModal
          isOpen={showStandbyModal}
          onClose={() => {
            setShowStandbyModal(false);
            setCancelledBookingId(null);
            fetchBookings(); // Refresh bookings
          }}
          cancelledBookingId={cancelledBookingId}
          onProviderSelected={(providerId) => {
            console.log("Provider selected:", providerId);
            setShowStandbyModal(false);
            setCancelledBookingId(null);
            fetchBookings(); // Refresh bookings
          }}
        />
      )}
    </div>
  );
}

