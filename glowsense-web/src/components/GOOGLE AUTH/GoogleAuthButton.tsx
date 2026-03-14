"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  role: "customer" | "provider";
  intent: "login" | "signup";
  text: string;
}

export function GoogleAuthButton({ role, intent, text }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const callbackUrl = `/${intent}/${role}`;
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <span className="text-lg font-bold">G</span>
            <span>{text}</span>
          </>
        )}
      </Button>
    </div>
  );
}
