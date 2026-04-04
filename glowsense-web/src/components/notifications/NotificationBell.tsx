"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, UserCheck, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: Record<string, unknown> | null;
  booking_id: number | null;
  created_at: string;
}

interface NotificationBellProps {
  role: string | null;
  onViewStandby?: (bookingId: number, data: Record<string, unknown>) => void;
}

export default function NotificationBell({ role, onViewStandby }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll unread count every 15s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [role]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("token");
    if (!token || !role) return;
    try {
      const endpoint =
        role === "provider"
          ? "http://localhost:8000/standby/notifications/provider/unread-count"
          : "http://localhost:8000/standby/notifications/customer/unread-count";
      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token || !role) return;
    try {
      const endpoint =
        role === "provider"
          ? "http://localhost:8000/standby/notifications/provider"
          : "http://localhost:8000/standby/notifications/customer";
      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/standby/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking_cancelled_by_provider":
        return <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />;
      case "standby_added":
        return <Clock className="h-5 w-5 text-blue-500 shrink-0" />;
      case "standby_selected":
        return <UserCheck className="h-5 w-5 text-green-500 shrink-0" />;
      case "refund_processed":
        return <DollarSign className="h-5 w-5 text-emerald-500 shrink-0" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500 shrink-0" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-96 max-h-[480px] overflow-y-auto bg-white rounded-xl shadow-2xl border border-border z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer ${
                    !n.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                    // If cancellation notification with standby data, trigger the standby view
                    if (
                      n.type === "booking_cancelled_by_provider" &&
                      n.data &&
                      n.booking_id &&
                      onViewStandby
                    ) {
                      onViewStandby(n.booking_id, n.data);
                      setOpen(false);
                    }
                  }}
                >
                  <div className="flex gap-3">
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      {/* Action hint for cancellation notifications */}
                      {n.type === "booking_cancelled_by_provider" && n.data && (
                        <p className="text-xs font-medium text-primary mt-1.5">
                          Click to view standby options →
                        </p>
                      )}
                    </div>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
