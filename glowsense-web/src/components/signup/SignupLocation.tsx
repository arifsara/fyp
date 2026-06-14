"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SignupLocationProps {
  onLocationChange: (location: string) => void;
  value?: string;
  required?: boolean;
}

export default function SignupLocation({
  onLocationChange,
  value = "",
  required = false,
}: SignupLocationProps) {
  const [country, setCountry] = useState("Pakistan");
  const [city, setCity] = useState(value);
  const [cityList, setCityList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchPakistanCities();
  }, []);

  // Update local city state when value prop changes from parent (only on prop change, not on local state change)
  useEffect(() => {
    if (value) {
      setCity(value);
    }
  }, [value]); // Only react to prop changes, not local state changes

  // Sync city with parent when it changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (city) {
      onLocationChange(city);
    }
  }, [city]); // Removed onLocationChange from dependencies to prevent infinite loop

  const fetchPakistanCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/pakistan-cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "Pakistan" }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch cities");
      }

      const data = await res.json();
      if (data.cities && Array.isArray(data.cities)) {
        // Sort cities alphabetically
        const sortedCities = [...data.cities].sort();
        setCityList(sortedCities);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Failed to fetch cities:", err);
      setError(err.message || "Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={country} onValueChange={setCountry} disabled>
          <SelectTrigger id="country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pakistan">Pakistan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city">
          City {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={city}
          onValueChange={(value) => {
            setCity(value);
            onLocationChange(value);
          }}
          required={required}
          disabled={loading}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder={loading ? "Loading cities..." : "Select your city"} />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading cities...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">
                {error}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchPakistanCities();
                  }}
                  className="ml-2 text-primary hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : cityList.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No cities available</div>
            ) : (
              cityList.map((cityName) => (
                <SelectItem key={cityName} value={cityName}>
                  {cityName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {error && !loading && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}

