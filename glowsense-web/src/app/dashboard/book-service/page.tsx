"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, DollarSign, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Service {
  id: number;
  name: string;
  price: string;
  duration: string;
}

interface Provider {
  id: number;
  full_name: string;
  business_name: string;
}

export default function BookServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const providerId = searchParams.get("providerId");

  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<{id: number, slot_date: string, time: string}[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "customer") {
      router.push("/login/customer");
      return;
    }

    if (serviceId && providerId) {
      fetchServiceDetails();
    }
  }, [serviceId, providerId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchServiceDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8000/providers/${providerId}`);
      if (!res.ok) throw new Error("Failed to fetch provider details");
      const data = await res.json();
      
      const foundService = data.services.find((s: Service) => s.id === parseInt(serviceId || "0"));
      if (foundService) {
        setService(foundService);
        setProvider({
          id: data.provider.id,
          full_name: data.provider.name,
          business_name: data.provider.business_name,
        });
      }
    } catch (err) {
      console.error("Failed to fetch service details", err);
      setError("Failed to load service details");
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !serviceId) return;
    
    setFetchingSlots(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8000/services/${serviceId}/available-slots?date=${selectedDate}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to fetch available slots");
      }
      const data = await res.json();
      setAvailableSlots(data.available_slots || []);
      if (data.available_slots.length === 0) {
        setError("No available time slots for this date. Please select another date.");
      }
      setSelectedSlotId(null); // Reset selection when date changes
    } catch (err: any) {
      setError(err.message);
      setAvailableSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlotId || !serviceId) {
      setError("Please select a date and time slot");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/bookings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          service_id: parseInt(serviceId || "0"),
          time_slot_id: selectedSlotId,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create booking");
      }

      const result = await res.json();
      // Show success message and redirect to bookings page
      alert("Booking created successfully! Waiting for provider approval. You'll be able to pay once the provider accepts your booking.");
      router.push("/dashboard/my-bookings");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/dashboard/providers">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Providers
        </Button>
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Book a Service</h1>
        <p className="text-muted-foreground">Select your preferred date and time</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {service && provider && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">{service.name}</h2>
            <p className="text-muted-foreground mb-4">{provider.business_name} - {provider.full_name}</p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-medium">${service.price}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" />
                <span>{service.duration}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                min={today}
                max={maxDateStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlotId(null);
                  setAvailableSlots([]);
                }}
                className="w-full"
              />
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>Select Time Slot</Label>
                {fetchingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading available slots...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedSlotId === slot.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No available time slots for this date
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                className="flex min-h-[100px] w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes for the provider..."
              />
            </div>

            {/* Book Button */}
            <Button
              onClick={handleBooking}
              disabled={loading || !selectedDate || !selectedSlotId}
              className="w-full h-12 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-5 w-5" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

