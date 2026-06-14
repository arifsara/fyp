"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, DollarSign, Calendar, User, Loader2, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payment {
  id: number;
  booking_id: number;
  amount: string;
  currency: string;
  status: string;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  paid_at?: string;
  refunded_at?: string;
  failure_reason?: string;
  service?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    full_name: string;
    email: string;
  };
  provider?: {
    id: number;
    business_name: string;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentRole = localStorage.getItem("role");
    
    if (!token) {
      router.push(currentRole === "provider" ? "/login/provider" : "/login/customer");
      return;
    }

    setRole(currentRole);
    fetchPayments();
  }, [router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const currentRole = localStorage.getItem("role");
      const endpoint = currentRole === "provider" 
        ? `${API_URL}/provider/payments`
        : `${API_URL}/customer/payments`;
      
      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to fetch payments" }));
        throw new Error(errorData.detail || "Failed to fetch payments");
      }

      const data = await res.json();
      setPayments(data || []);
    } catch (err: any) {
      console.error("Failed to fetch payments:", err);
      setError(err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "succeeded":
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
      case "refunded":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "succeeded":
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "refunded":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const calculateTotal = () => {
    return payments
      .filter((p) => p.status === "succeeded" || p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            {role === "provider" 
              ? "View all payments received from customers"
              : "View all your payment transactions"}
          </p>
        </div>
        {payments.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {role === "provider" ? "Total Received" : "Total Spent"}
            </p>
            <p className="text-2xl font-bold text-primary">
              {calculateTotal().toFixed(2)} {payments[0]?.currency?.toUpperCase() || "PKR"}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Payment History</h2>
          <p className="text-muted-foreground">
            {role === "provider"
              ? "You haven't received any payments yet."
              : "You haven't made any payments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {payment.service?.name || "Service Payment"}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {role === "provider" && payment.customer && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Customer: {payment.customer.full_name} ({payment.customer.email})
                        </span>
                      </div>
                    )}

                    {role === "customer" && payment.provider && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Provider: {payment.provider.business_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {payment.paid_at
                            ? `Paid: ${formatDate(payment.paid_at)}`
                            : `Created: ${formatDate(payment.created_at)}`}
                        </span>
                      </div>

                      {payment.payment_method && (
                        <span className="capitalize">
                          Method: {payment.payment_method}
                        </span>
                      )}

                      {payment.refunded_at && (
                        <span className="text-orange-600">
                          Refunded: {formatDate(payment.refunded_at)}
                        </span>
                      )}
                    </div>

                    {payment.failure_reason && (
                      <div className="text-red-600 text-xs">
                        Failure reason: {payment.failure_reason}
                      </div>
                    )}

                    {payment.stripe_payment_intent_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        Payment ID: {payment.stripe_payment_intent_id.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-1">
                    <DollarSign className="h-6 w-6" />
                    <span>{parseFloat(payment.amount || "0").toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.currency?.toUpperCase() || "PKR"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Booking #{payment.booking_id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
