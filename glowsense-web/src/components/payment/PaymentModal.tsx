"use client";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { X, CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  amount: number;
  serviceName: string;
  onSuccess: () => void;
}

function PaymentForm({ bookingId, amount, serviceName, onSuccess, onClose }: { bookingId: number; amount: number; serviceName: string; onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when modal opens
    const createPaymentIntent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
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
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment");
      }
    };

    createPaymentIntent();
  }, [bookingId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm payment on backend
        const token = localStorage.getItem("token");
        const confirmRes = await fetch("http://localhost:8000/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            booking_id: bookingId,
          }),
        });

        if (!confirmRes.ok) {
          throw new Error("Failed to confirm payment");
        }

        // Success!
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
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Service</span>
          <span className="font-semibold">{serviceName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="text-xl font-bold text-primary">${amount.toFixed(2)}</span>
        </div>
      </div>

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

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${amount.toFixed(2)}
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

export default function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  amount,
  serviceName,
  onSuccess,
}: PaymentModalProps) {
  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    mode: "payment",
    amount: Math.round(amount * 100), // Convert to cents
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
          <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
          <p className="text-muted-foreground">Enter your card details to complete the booking</p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            bookingId={bookingId}
            amount={amount}
            serviceName={serviceName}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}

