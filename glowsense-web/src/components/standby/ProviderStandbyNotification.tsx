"use client";

import { useState, useEffect } from "react";
import { X, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StandbyNotification {
  id: number;
  message: string;
  created_at: string;
  shown_until: string;
  is_read: boolean;
}

interface ProviderStandbyNotificationProps {
  onClose?: () => void;
}

export default function ProviderStandbyNotification({ onClose }: ProviderStandbyNotificationProps) {
  const [notifications, setNotifications] = useState<StandbyNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:8000/standby/provider/notifications", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch standby notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/standby/provider/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  if (loading) {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  // Show only unread notifications
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  if (unreadNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {unreadNotifications.map((notification) => (
        <Card key={notification.id} className="border-blue-200 bg-blue-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Standby List Notification</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  markAsRead(notification.id);
                  if (onClose) onClose();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-gray-700 mb-3">
              {notification.message}
            </CardDescription>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Shown until {new Date(notification.shown_until).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                markAsRead(notification.id);
                if (onClose) onClose();
              }}
            >
              Got it
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

