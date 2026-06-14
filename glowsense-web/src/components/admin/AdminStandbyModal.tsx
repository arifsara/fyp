"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCheck, MapPin, Star, Loader2 } from "lucide-react";

interface SuggestedProvider {
  id: number;
  full_name: string;
  business_name: string | null;
  city: string | null;
  level: string;
  price: string;
  service_id: number | null;
}

interface AdminStandbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  onAssign: (bookingId: number, providerId: number) => Promise<void>;
  originalPrice: string;
}

export default function AdminStandbyModal({ 
  isOpen, 
  onClose, 
  bookingId, 
  onAssign,
  originalPrice
}: AdminStandbyModalProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<SuggestedProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchSuggestedProviders();
    }
  }, [isOpen, bookingId]);

  const fetchSuggestedProviders = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/admin/standby/suggested-providers/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (err) {
      console.error("Error fetching suggested providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const parsePrice = (priceStr: string) => {
    const cleaned = priceStr.replace("$", "").replace(",", "").trim();
    if (cleaned.includes("-")) return parseFloat(cleaned.split("-")[0]);
    return parseFloat(cleaned);
  };

  const getPriceDiff = (newPrice: string) => {
    const oldP = parsePrice(originalPrice);
    const newP = parsePrice(newPrice);
    const diff = newP - oldP;
    if (Math.abs(diff) < 0.01) return { text: "Same Price", color: "text-slate-500" };
    if (diff > 0) return { text: `+$${diff.toFixed(2)} Extra`, color: "text-amber-600" };
    return { text: `-$${Math.abs(diff).toFixed(2)} Refund`, color: "text-emerald-600" };
  };

  const filteredProviders = providers.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignClick = async (providerId: number) => {
    setAssigningId(providerId);
    await onAssign(bookingId, providerId);
    setAssigningId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl">
        <div className="p-6 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-600" />
              Assign Replacement
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Select a standby provider for Booking #{bookingId}. 
              Category and Location matching recommended.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter providers by name or city..." 
              className="pl-9 h-11 border-slate-200 focus:ring-blue-500 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-500 font-medium">Finding best matches...</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-slate-900 font-bold">No matching providers found</p>
              <p className="text-slate-500 text-sm mt-1">Try broadening your search or check provider categories.</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredProviders.map((p) => {
                const diff = getPriceDiff(p.price);
                return (
                  <div key={p.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-md hover:shadow-blue-50/50 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {p.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.business_name || p.full_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center text-xs text-slate-500">
                            <MapPin className="h-3 w-3 mr-1" /> {p.city || "N/A"}
                          </span>
                          <span className="flex items-center text-xs text-slate-500">
                            <Star className="h-3 w-3 mr-1 text-amber-400 fill-current" /> {p.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{p.price}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-tighter ${diff.color}`}>
                          {diff.text}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        disabled={assigningId === p.id}
                        onClick={() => handleAssignClick(p.id)}
                      >
                        {assigningId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-slate-600 hover:bg-slate-200/50">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
