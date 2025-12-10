"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AIChatInterface from "@/components/rag/AIChatInterface";

export default function AIAssistantPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login/customer");
      return;
    }

    // Fetch user ID from profile or use a default
    // For now, we'll get it from the customer profile endpoint
    fetchUserId();
  }, []);

  const fetchUserId = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      if (role === "customer") {
        const res = await fetch("http://localhost:8000/customer/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id);
        } else {
          const errorData = await res.json().catch(() => ({ detail: "Failed to load customer profile" }));
          console.error("Failed to fetch customer profile:", res.status, errorData);
        }
      } else if (role === "provider") {
        const res = await fetch("http://localhost:8000/provider/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id);
        } else {
          const errorData = await res.json().catch(() => ({ detail: "Failed to load provider profile" }));
          console.error("Failed to fetch provider profile:", res.status, errorData);
        }
      } else {
        console.error("Unknown role:", role);
      }
    } catch (error) {
      console.error("Failed to fetch user ID:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Failed to load user information</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Get personalized service provider recommendations powered by AI
        </p>
      </div>
      <AIChatInterface userId={userId} />
    </div>
  );
}

