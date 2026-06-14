"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaymentModal from "@/components/payment/PaymentModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2, History, DollarSign, Calendar, User } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: number;
  booking_id: number;
  amount: string;
  currency: string;
  status: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
  service?: {
    id: number;
    name: string;
  };
  provider?: {
    id: number;
    business_name: string;
  };
  stripe_payment_intent_id?: string;
}

import { Suspense } from "react";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const amountStr = searchParams.get("amount");
  const serviceName = searchParams.get("serviceName");

  const [amount, setAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "customer") {
      router.push("/login/customer");
      return;
    }

    if (!bookingId || !amountStr) {
      router.push("/dashboard/my-bookings");
      return;
    }

    // Parse amount (handle ranges like "50-100" by taking first value)
    const priceStr = amountStr.split("-")[0].trim().replace("$", "").replace(",", "");
    const parsedAmount = parseFloat(priceStr);
    if (isNaN(parsedAmount)) {
      router.push("/dashboard/my-bookings");
      return;
    }
    setAmount(parsedAmount);
    setShowPaymentModal(true);
    fetchTransactions();
  }, [bookingId, amountStr, router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(`${API_URL}/customer/payments`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowPaymentModal(false);
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Your payment has been processed successfully. Your booking is now confirmed.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="font-semibold">{serviceName || "Service"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-xl font-bold text-primary">${amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/my-bookings" className="flex-1">
                <Button className="w-full">View My Bookings</Button>
              </Link>
              <Link href="/dashboard/providers" className="flex-1">
                <Button variant="outline" className="w-full">Book Another Service</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <Link href="/dashboard/my-bookings">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
      </Link>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-muted-foreground mb-6">
          Please complete the payment to confirm your booking.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="font-semibold">{serviceName || "Service"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-xl font-bold text-primary">${amount.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={() => setShowPaymentModal(true)}
          className="w-full h-12 text-lg"
          disabled={!bookingId || amount === 0}
        >
          Proceed to Payment
        </Button>
      </div>

      {bookingId && amount > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            fetchTransactions(); // Refresh transactions after payment
          }}
          bookingId={parseInt(bookingId)}
          amount={amount}
          serviceName={serviceName || "Service"}
          onSuccess={() => {
            handlePaymentSuccess();
            fetchTransactions(); // Refresh transactions after successful payment
          }}
        />
      )}

      {/* Transaction History Section */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </div>

        {loadingTransactions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {transaction.service?.name || "Service"}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "succeeded"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : transaction.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    {transaction.provider && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        <span>{transaction.provider.business_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {transaction.paid_at
                            ? new Date(transaction.paid_at).toLocaleDateString()
                            : new Date(transaction.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {transaction.payment_method && (
                        <span className="capitalize">{transaction.payment_method}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span>{parseFloat(transaction.amount).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {transaction.currency.toUpperCase()}
                    </div>
                  </div>
                </div>
                {transaction.stripe_payment_intent_id && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Payment ID: {transaction.stripe_payment_intent_id.substring(0, 20)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
