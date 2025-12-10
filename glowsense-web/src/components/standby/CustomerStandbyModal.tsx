"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, Star, Clock } from "lucide-react";
import StandbyProviderList from "./StandbyProviderList";
import ProviderLevelBadge from "@/components/rating/ProviderLevelBadge";

interface StandbyProvider {
  provider_id: number;
  provider_name: string;
  business_name: string;
  city: string;
  profile_picture?: string;
  level: string;
  level_info: {
    name: string;
    color: string;
    icon: string;
  };
  average_rating: number;
  standby_queue_id: number;
  available_slot_date: string;
  services: Array<{ id: number; name: string; price: string }>;
}

interface CustomerStandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelledBookingId: number;
  onProviderSelected?: (providerId: number) => void;
}

export default function CustomerStandbyModal({
  isOpen,
  onClose,
  cancelledBookingId,
  onProviderSelected,
}: CustomerStandbyModalProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<StandbyProvider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<StandbyProvider | null>(null);

  useEffect(() => {
    if (isOpen && cancelledBookingId) {
      fetchAvailableProviders();
    }
  }, [isOpen, cancelledBookingId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchAvailableProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:8000/standby/customer/available-providers?cancelled_booking_id=${cancelledBookingId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to fetch available providers");
      }
      const data = await res.json();
      setProviders(data.available_providers || []);
    } catch (err: any) {
      console.error("Failed to fetch standby providers:", err);
      setError(err.message || "Failed to load available providers");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = async (provider: StandbyProvider) => {
    setSelectedProvider(provider);
    if (onProviderSelected) {
      onProviderSelected(provider.provider_id);
    }
    // Here you would typically create a new booking with the selected provider
    // For now, we'll just close the modal
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automated Standby Support</DialogTitle>
          <DialogDescription>
            Your booking was cancelled. Here are available service providers for the same time slot.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Finding available providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button variant="outline" onClick={fetchAvailableProviders} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No available providers found for this time slot.</p>
            <p className="text-sm mt-2">Please try booking again later.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {providers.map((provider) => (
              <div
                key={provider.provider_id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {provider.profile_picture ? (
                      <img
                        src={
                          provider.profile_picture.startsWith("http")
                            ? provider.profile_picture
                            : `http://localhost:8000${provider.profile_picture}`
                        }
                        alt={provider.provider_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Star className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{provider.provider_name}</h3>
                      <ProviderLevelBadge
                        level={provider.level}
                        levelInfo={provider.level_info}
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{provider.business_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      {provider.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{provider.city}</span>
                        </div>
                      )}
                      {provider.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{provider.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(provider.available_slot_date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {provider.services.length > 0 && (
                      <div className="text-sm text-muted-foreground mb-3">
                        <span className="font-medium">Services: </span>
                        {provider.services.map((s) => s.name).join(", ")}
                      </div>
                    )}
                    <Button
                      onClick={() => handleSelectProvider(provider)}
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      Select This Provider
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

