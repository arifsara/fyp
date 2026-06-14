"use client";
import { API_URL } from "@/lib/api";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Star,
  MapPin,
  UserCheck,
  DollarSign,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useCustomAlert } from "@/components/providers/CustomAlertProvider";

interface StandbyProvider {
  id: number;
  full_name: string;
  business_name: string | null;
  city: string | null;
  level: string;
  average_rating: number;
}

interface StandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  providers: StandbyProvider[];
  onSelectProvider: (providerId: number) => void;
  onRequestRefund: () => void;
}

export default function StandbyModal({
  isOpen,
  onClose,
  bookingId,
  providers,
  onSelectProvider,
  onRequestRefund,
}: StandbyModalProps) {
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [refunding, setRefunding] = useState(false);
  const { showAlert, showConfirm } = useCustomAlert();

  if (!isOpen) return null;

  const handleSelect = async (providerId: number) => {
    setSelectingId(providerId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/standby/select-provider`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          new_provider_id: providerId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showAlert(data.detail || "Failed to select provider");
        return;
      }

      showAlert("Provider selected! Waiting for them to accept. You'll be able to pay once they confirm.");
      onSelectProvider(providerId);
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("An error occurred");
    } finally {
      setSelectingId(null);
    }
  };

  const handleRefund = async () => {
    if (!(await showConfirm("Are you sure you want to request a refund? This action cannot be undone."))) return;
    setRefunding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/standby/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        showAlert(data.detail || "Refund failed");
        return;
      }

      showAlert("Refund has been processed! The amount will be returned to your payment method within 5-10 business days.");
      onRequestRefund();
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("An error occurred");
    } finally {
      setRefunding(false);
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-gray-100 text-gray-700",
      skilled: "bg-blue-100 text-blue-700",
      expert: "bg-purple-100 text-purple-700",
    };
    return colors[level] || colors.beginner;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Booking Cancelled</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your provider cancelled. Choose a replacement or get a refund.
            </p>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Provider List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {providers.length > 0 ? (
            <>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                <UserCheck className="h-4 w-4 inline mr-1" />
                {providers.length} standby provider{providers.length > 1 ? "s" : ""} available
              </p>
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{p.full_name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getLevelBadge(
                            p.level
                          )}`}
                        >
                          {p.level}
                        </span>
                      </div>
                      {p.business_name && (
                        <p className="text-sm text-muted-foreground">{p.business_name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {p.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {p.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {p.average_rating > 0 ? p.average_rating.toFixed(1) : "New"}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelect(p.id)}
                      disabled={selectingId !== null}
                    >
                      {selectingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Select
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium mb-1">No standby providers found</p>
              <p className="text-sm text-muted-foreground">
                No matching providers are available at this time. You can request a refund below.
              </p>
            </div>
          )}
        </div>

        {/* Footer — Refund Button */}
        <div className="px-6 py-4 border-t border-border bg-gray-50">
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleRefund}
            disabled={refunding}
          >
            {refunding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing Refund...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" /> Request Full Refund
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
