"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { X, CreditCard, Loader2, CheckCircle, AlertCircle, ArrowUpRight } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface DifferencePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  serviceName: string;
  onSuccess: () => void;
}

function DiffPaymentForm({
  bookingId,
  serviceName,
  onSuccess,
  onClose,
}: {
  bookingId: number;
  serviceName: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [extraAmount, setExtraAmount] = useState(0);
  const [originalPaid, setOriginalPaid] = useState(0);
  const [newTotal, setNewTotal] = useState(0);

  useEffect(() => {
    const createDiffIntent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/standby/pay-difference/create-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ booking_id: bookingId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to create payment intent");
        }

        const data = await res.json();
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.payment_intent_id);
        setExtraAmount(data.extra_amount);
        setOriginalPaid(data.original_paid);
        setNewTotal(data.new_total);
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment");
      }
    };

    createDiffIntent();
  }, [bookingId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const token = localStorage.getItem("token");
        const confirmRes = await fetch(`${API_URL}/standby/pay-difference/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            booking_id: bookingId,
          }),
        });

        if (!confirmRes.ok) {
          throw new Error("Failed to confirm payment");
        }

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#9e2146" },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        <span className="ml-2 text-muted-foreground">Calculating difference...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Price breakdown */}
      <div className="bg-amber-50 rounded-xl p-4 space-y-2 border border-amber-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Already Paid (in Escrow)</span>
          <span className="font-medium">${originalPaid.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">New Provider Price</span>
          <span className="font-medium">${newTotal.toFixed(2)}</span>
        </div>
        <div className="border-t border-amber-300 pt-2 mt-2 flex items-center justify-between">
          <span className="font-semibold text-amber-800">Amount Due</span>
          <span className="text-xl font-bold text-amber-700">${extraAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
        <span className="font-medium">Service:</span> {serviceName}
      </div>

      {/* Card input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Card Details</label>
        <div className="border border-border rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || processing} className="flex-1 bg-amber-600 hover:bg-amber-700">
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${extraAmount.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Your payment is secure and encrypted
      </p>
    </form>
  );
}

export default function DifferencePaymentModal({
  isOpen,
  onClose,
  bookingId,
  serviceName,
  onSuccess,
}: DifferencePaymentModalProps) {
  if (!isOpen) return null;

  // We use a small default amount; actual amount is fetched from the backend
  const options: StripeElementsOptions = {
    mode: "payment",
    amount: 100,  // Minimum placeholder — real amount loaded dynamically
    currency: "usd",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-bold">Pay Price Difference</h2>
          </div>
          <p className="text-muted-foreground">
            The standby provider's rate is higher. Pay the difference to confirm your booking.
          </p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <DiffPaymentForm
            bookingId={bookingId}
            serviceName={serviceName}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}
