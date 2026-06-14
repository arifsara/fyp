"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AIChatInterface from "@/components/rag/AIChatInterface";

export default function AIAssistantPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
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
        const res = await fetch(`${API_URL}/customer/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id);
          const name = data.full_name || data.business_name || data.name || "there";
          setUserName(name.split(" ")[0]);
        } else {
          const errorData = await res.json().catch(() => ({ detail: "Failed to load customer profile" }));
          console.error("Failed to fetch customer profile:", res.status, errorData);
        }
      } else if (role === "provider") {
        const res = await fetch(`${API_URL}/provider/profile`, {
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
    <div className="flex flex-col h-full w-full">
      <AIChatInterface userId={userId} userName={userName} />
    </div>
  );
}

