"use client";

import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  totalRatings?: number;
  showTotal?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function RatingDisplay({
  rating,
  totalRatings,
  showTotal = false,
  size = "md",
}: RatingDisplayProps) {
  const starSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const displayRating = rating || 0;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize[size]} ${
              star <= fullStars
                ? "fill-yellow-400 text-yellow-400"
                : star === fullStars + 1 && hasHalfStar
                ? "fill-yellow-200 text-yellow-200"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium ml-1">
        {displayRating.toFixed(1)}
      </span>
      {showTotal && totalRatings !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">
          ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
        </span>
      )}
    </div>
  );
}

