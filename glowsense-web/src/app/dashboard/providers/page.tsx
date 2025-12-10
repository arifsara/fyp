"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Phone, Mail, Briefcase, Image as ImageIcon, DollarSign, Clock, Star } from "lucide-react";
import Link from "next/link";
import RatingDisplay from "@/components/rating/RatingDisplay";
import ProviderLevelBadge from "@/components/rating/ProviderLevelBadge";

interface ServiceProvider {
  id: number;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  profile_picture?: string;
  profile_photo?: string;
  average_rating?: number;
  total_ratings?: number;
  level?: string;
  level_info?: {
    name: string;
    color: string;
    icon: string;
  };
}

interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
}

interface Service {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: string;
  duration: string;
}

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

interface ProviderDetails {
  provider: ServiceProvider;
  portfolio_items: PortfolioItem[];
  services: Service[];
}

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [providerRatings, setProviderRatings] = useState<Record<number, { average: number; total: number }>>({});
  const [providerRatingsList, setProviderRatingsList] = useState<Record<number, Rating[]>>({});

  useEffect(() => {
    // Check if user is logged in as customer
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "customer") {
      router.push("/login/customer");
      return;
    }
    
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch("http://localhost:8000/providers");
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setProviders(data);
      
      // Fetch ratings for all providers
      const ratingsPromises = data.map((provider: ServiceProvider) =>
        fetch(`http://localhost:8000/ratings/provider/${provider.id}/average`)
          .then(res => res.json())
          .then(ratingData => ({
            id: provider.id,
            average: ratingData.average_rating,
            total: ratingData.total_ratings
          }))
          .catch(() => ({ id: provider.id, average: 0, total: 0 }))
      );
      
      const ratings = await Promise.all(ratingsPromises);
      const ratingsMap: Record<number, { average: number; total: number }> = {};
      ratings.forEach((r: { id: number; average: number; total: number }) => {
        ratingsMap[r.id] = { average: r.average, total: r.total };
      });
      setProviderRatings(ratingsMap);
    } catch (err) {
      console.error("Failed to fetch providers", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetails = async (providerId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/providers/${providerId}`);
      if (!res.ok) throw new Error("Failed to fetch provider details");
      const data = await res.json();
      setSelectedProvider(data);
      
      // Fetch rating for this provider if not already loaded
      if (!providerRatings[providerId]) {
        try {
          const ratingRes = await fetch(`http://localhost:8000/ratings/provider/${providerId}/average`);
          if (ratingRes.ok) {
            const ratingData = await ratingRes.json();
            setProviderRatings(prev => ({
              ...prev,
              [providerId]: {
                average: ratingData.average_rating,
                total: ratingData.total_ratings
              }
            }));
          }
        } catch (err) {
          console.error("Failed to fetch rating", err);
        }
      }
      
      // Fetch all ratings for this provider (for display in profile)
      try {
        const ratingsRes = await fetch(`http://localhost:8000/ratings/provider/${providerId}/all`);
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setProviderRatingsList(prev => ({
            ...prev,
            [providerId]: ratingsData.ratings || []
          }));
          
          // Also update the average rating
          setProviderRatings(prev => ({
            ...prev,
            [providerId]: {
              average: ratingsData.average_rating,
              total: ratingsData.total_ratings
            }
          }));
        }
      } catch (err) {
        console.error("Failed to fetch ratings list", err);
      }
    } catch (err) {
      console.error("Failed to fetch provider details", err);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = 
      provider.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (selectedProvider) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <Button variant="outline" onClick={() => setSelectedProvider(null)}>
          ← Back to All Providers
        </Button>

        {/* Provider Header */}
        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
              {selectedProvider.provider.profile_picture || selectedProvider.provider.profile_photo ? (
                <img 
                  src={(selectedProvider.provider.profile_picture || selectedProvider.provider.profile_photo)?.startsWith('http') 
                    ? (selectedProvider.provider.profile_picture || selectedProvider.provider.profile_photo) 
                    : `http://localhost:8000${selectedProvider.provider.profile_picture || selectedProvider.provider.profile_photo}`}
                  alt={selectedProvider.provider.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${selectedProvider.provider.profile_picture || selectedProvider.provider.profile_photo ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                <Briefcase className="h-12 w-12 text-primary" />
              </div>
            </div>
              <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold">{selectedProvider.provider.full_name}</h1>
                {selectedProvider.provider.level && (
                  <ProviderLevelBadge 
                    level={selectedProvider.provider.level} 
                    levelInfo={selectedProvider.provider.level_info}
                    size="lg"
                  />
                )}
                {providerRatings[selectedProvider.provider.id] && providerRatings[selectedProvider.provider.id].total > 0 && (
                  <RatingDisplay
                    rating={providerRatings[selectedProvider.provider.id].average}
                    totalRatings={providerRatings[selectedProvider.provider.id].total}
                    showTotal={true}
                    size="md"
                  />
                )}
              </div>
              <h2 className="text-xl text-muted-foreground mb-4">{selectedProvider.provider.business_name}</h2>
              {selectedProvider.provider.bio && (
                <p className="text-muted-foreground mb-4">{selectedProvider.provider.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {selectedProvider.provider.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedProvider.provider.city}</span>
                  </div>
                )}
                {selectedProvider.provider.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{selectedProvider.provider.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{selectedProvider.provider.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Portfolio</h2>
          {selectedProvider.portfolio_items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No portfolio items yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedProvider.portfolio_items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {item.image_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:8000${item.image_url}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ratings Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Customer Ratings & Reviews</h2>
          {providerRatings[selectedProvider.provider.id] && providerRatings[selectedProvider.provider.id].total > 0 ? (
            <div className="space-y-4">
              {/* Rating Summary */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <RatingDisplay
                      rating={providerRatings[selectedProvider.provider.id].average}
                      totalRatings={providerRatings[selectedProvider.provider.id].total}
                      showTotal={true}
                      size="lg"
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {providerRatings[selectedProvider.provider.id].average.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">out of 5.0</div>
                  </div>
                </div>
              </div>

              {/* Individual Ratings */}
              {providerRatingsList[selectedProvider.provider.id] && providerRatingsList[selectedProvider.provider.id].length > 0 ? (
                <div className="space-y-3">
                  {providerRatingsList[selectedProvider.provider.id].map((rating) => (
                    <div
                      key={rating.id}
                      className="bg-white rounded-2xl border border-border p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <RatingDisplay rating={rating.rating} size="md" />
                            {rating.service_name && (
                              <span className="text-sm font-medium text-muted-foreground">
                                {rating.service_name}
                              </span>
                            )}
                          </div>
                          {rating.customer_name && (
                            <p className="text-sm text-muted-foreground mb-2">
                              by {rating.customer_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {rating.comment && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-foreground">{rating.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-border p-6 text-center text-muted-foreground">
                  Loading ratings...
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
              <p className="text-muted-foreground">
                This provider hasn't received any ratings yet.
              </p>
            </div>
          )}
        </div>

        {/* Services Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Services Offered</h2>
          {selectedProvider.services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No services available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProvider.services.map((service) => (
                <div key={service.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                      <span className="text-sm text-muted-foreground capitalize">{service.category}</span>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">${service.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{service.duration}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      router.push(`/dashboard/book-service?serviceId=${service.id}&providerId=${selectedProvider.provider.id}`);
                    }}
                  >
                    Book This Service
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Find Service Providers</h1>
        <p className="text-muted-foreground">Browse expert beauty professionals and their services</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, business, city, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      {filteredProviders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No providers found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <div 
              key={provider.id} 
              className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchProviderDetails(provider.id)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {provider.profile_picture || provider.profile_photo ? (
                    <img 
                      src={(provider.profile_picture || provider.profile_photo)?.startsWith('http') 
                        ? (provider.profile_picture || provider.profile_photo) 
                        : `http://localhost:8000${provider.profile_picture || provider.profile_photo}`}
                      alt={provider.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${provider.profile_picture || provider.profile_photo ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{provider.full_name}</h3>
                    {provider.level && (
                      <ProviderLevelBadge 
                        level={provider.level} 
                        levelInfo={provider.level_info}
                        size="sm"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">{provider.business_name}</p>
                  {providerRatings[provider.id] && providerRatings[provider.id].total > 0 && (
                    <RatingDisplay
                      rating={providerRatings[provider.id].average}
                      totalRatings={providerRatings[provider.id].total}
                      showTotal={true}
                      size="sm"
                    />
                  )}
                </div>
              </div>
              
              {provider.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{provider.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                {provider.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{provider.city}</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchProviderDetails(provider.id);
                }}
              >
                View Profile & Services
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

