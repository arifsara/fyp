"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, Calendar, User } from "lucide-react";
import RatingDisplay from "@/components/rating/RatingDisplay";

interface Rating {
  id: number;
  booking_id: number;
  customer_id: number;
  provider_id: number;
  service_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name: string | null;
  service_name: string | null;
}

interface RatingStats {
  provider_id: number;
  average_rating: number;
  total_ratings: number;
  ratings: Rating[];
}

export default function ProviderRatingsPage() {
  const router = useRouter();
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "provider") {
      router.push("/login/provider");
      return;
    }

    fetchRatings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchRatings = async () => {
    try {
      const res = await fetch("http://localhost:8000/ratings/provider/my-ratings", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch ratings");
      const data = await res.json();
      setRatingStats(data);
    } catch (err) {
      console.error("Failed to fetch ratings", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">My Ratings</h1>
        <p className="text-muted-foreground">View all ratings and feedback from customers</p>
      </div>

      {/* Rating Summary */}
      {ratingStats && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Overall Rating</h2>
              <RatingDisplay
                rating={ratingStats.average_rating}
                totalRatings={ratingStats.total_ratings}
                showTotal={true}
                size="lg"
              />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {ratingStats.average_rating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">out of 5.0</div>
            </div>
          </div>
        </div>
      )}

      {/* Ratings List */}
      {ratingStats && ratingStats.ratings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
          <p className="text-muted-foreground">
            You haven't received any ratings from customers yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Ratings ({ratingStats?.total_ratings || 0})</h2>
          {ratingStats?.ratings.map((rating) => (
            <div
              key={rating.id}
              className="bg-white rounded-2xl border border-border p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <RatingDisplay rating={rating.rating} size="md" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.service_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">{rating.service_name}</span>
                    </div>
                  )}
                  {rating.customer_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{rating.customer_name}</span>
                    </div>
                  )}
                </div>
              </div>
              {rating.comment && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-foreground">{rating.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

