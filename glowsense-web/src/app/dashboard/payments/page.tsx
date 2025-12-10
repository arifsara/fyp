import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center text-green-600">
        <CreditCard className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payments & History</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          View your transaction history and manage payment methods.
        </p>
      </div>
    </div>
  );
}

