"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Edit, Trash2, Image as ImageIcon, Video, Calendar, DollarSign, Clock, Save, Loader2 } from "lucide-react";

interface PortfolioItem {
  id?: number;
  title: string;
  description?: string;
  experience_details?: string;
  image_url?: string;
  video_url?: string;
}

interface Service {
  id?: number;
  name: string;
  category: string;
  description?: string;
  price: string;
  duration: string;
  availability_schedule?: any;
}

export default function PortfolioManagementPage() {
  const [activeTab, setActiveTab] = useState<"portfolio" | "services">("portfolio");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Portfolio Form State
  const [portfolioForm, setPortfolioForm] = useState<PortfolioItem>({ title: "" });
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<number | null>(null);

  // Service Form State
  const [serviceForm, setServiceForm] = useState<Service>({
    name: "",
    category: "hair",
    description: "",
    price: "",
    duration: ""
  });
  const [editingService, setEditingService] = useState<number | null>(null);
  const [managingTimeSlots, setManagingTimeSlots] = useState<number | null>(null);
  const [timeSlotForm, setTimeSlotForm] = useState({
    start_date: "",
    end_date: "",
    days_of_week: [] as number[], // 0=Monday, 6=Sunday
    start_time: "09:00",
    end_time: "17:00",
    interval_minutes: 30
  });
  const [creatingSlots, setCreatingSlots] = useState(false);

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  };

  useEffect(() => {
    // Check if user is logged in as provider
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "provider") {
      console.error("Not authenticated as provider");
      return;
    }
    
    fetchPortfolio();
    fetchServices();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`http://localhost:8000/provider/portfolio`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();
      setPortfolioItems(data);
    } catch (err) {
      console.error("Failed to fetch portfolio", err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`http://localhost:8000/provider/services`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  const handlePortfolioUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8000/upload/portfolio", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleAddPortfolio = async () => {
    setLoading(true);
    try {
      let imageUrl = portfolioForm.image_url;
      let videoUrl = portfolioForm.video_url;

      if (portfolioFile) {
        const url = await handlePortfolioUpload(portfolioFile);
        if (portfolioFile.type.startsWith("video/")) {
          videoUrl = url;
        } else {
          imageUrl = url;
        }
      }

      const payload = { ...portfolioForm, image_url: imageUrl, video_url: videoUrl };
      
      if (editingPortfolio) {
        // Update existing
        const res = await fetch(`http://localhost:8000/provider/portfolio/${editingPortfolio}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update portfolio");
      } else {
        // Create new
        const res = await fetch(`http://localhost:8000/provider/portfolio`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create portfolio");
      }

      setPortfolioForm({ title: "" });
      setPortfolioFile(null);
      setEditingPortfolio(null);
      fetchPortfolio();
    } catch (err) {
      console.error("Failed to save portfolio", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePortfolio = async (id: number) => {
    if (!confirm("Delete this portfolio item?")) return;
    try {
      const res = await fetch(`http://localhost:8000/provider/portfolio/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchPortfolio();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleAddService = async () => {
    setLoading(true);
    try {
      if (editingService) {
        const res = await fetch(`http://localhost:8000/provider/services/${editingService}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(serviceForm),
        });
        if (!res.ok) throw new Error("Failed to update service");
      } else {
        const res = await fetch(`http://localhost:8000/provider/services`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(serviceForm),
        });
        if (!res.ok) throw new Error("Failed to create service");
      }

      setServiceForm({ name: "", category: "hair", description: "", price: "", duration: "" });
      setEditingService(null);
      fetchServices();
    } catch (err) {
      console.error("Failed to save service", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      const res = await fetch(`http://localhost:8000/provider/services/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchServices();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio & Services Management</h1>
          <p className="text-muted-foreground mt-2">Showcase your work and manage your offerings</p>
        </div>
      </div>

            {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "portfolio" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "services" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Services
        </button>
      </div>

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          {/* Add Portfolio Form */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {editingPortfolio ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="e.g. Bridal Makeup - Summer 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Photo/Video</Label>
                <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary">
                  <Upload className="h-5 w-5 mr-2" />
                  <span className="text-sm">Choose File</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setPortfolioFile(e.target.files[0])}
                  />
                </label>
                {portfolioFile && <p className="text-sm text-muted-foreground">{portfolioFile.name}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                  value={portfolioForm.description || ""}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  placeholder="Describe this work..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Experience Details</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                  value={portfolioForm.experience_details || ""}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, experience_details: e.target.value })}
                  placeholder="Years of experience, certifications, specializations..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddPortfolio} disabled={loading || !portfolioForm.title}>
                {editingPortfolio ? "Update" : "Add"} Portfolio Item
              </Button>
              {editingPortfolio && (
                <Button variant="outline" onClick={() => { setEditingPortfolio(null); setPortfolioForm({ title: "" }); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Portfolio Grid */}
          {portfolioItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No portfolio items yet</h3>
              <p className="text-muted-foreground mb-4">Start showcasing your work by adding your first portfolio item above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {item.image_url ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:8000${item.image_url}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden aspect-video bg-muted flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                  ) : item.video_url ? (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Video className="h-12 w-12 text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Video</span>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    {item.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>}
                    {item.experience_details && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.experience_details}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { 
                          setEditingPortfolio(item.id!); 
                          setPortfolioForm({
                            title: item.title || "",
                            description: item.description || "",
                            experience_details: item.experience_details || "",
                            image_url: item.image_url || "",
                            video_url: item.video_url || ""
                          });
                          setPortfolioFile(null);
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeletePortfolio(item.id!)}
                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {/* Add Service Form */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? "Edit Service" : "Add New Service"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Haircut & Style"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                >
                  <option value="hair">Hair</option>
                  <option value="skin">Skin</option>
                  <option value="makeup">Makeup</option>
                  <option value="nails">Nails</option>
                  <option value="spa">Spa</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="e.g. 50 or 50-100"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                  placeholder="e.g. 60 minutes"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-xl border border-input bg-input px-3 py-2 text-sm"
                  value={serviceForm.description || ""}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Describe what's included in this service..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddService} disabled={loading || !serviceForm.name || !serviceForm.price}>
                {editingService ? "Update" : "Add"} Service
              </Button>
              {editingService && (
                <Button variant="outline" onClick={() => { setEditingService(null); setServiceForm({ name: "", category: "hair", description: "", price: "", duration: "" }); }}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Services List */}
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services yet</h3>
              <p className="text-muted-foreground mb-4">Add your first service above to start offering your expertise.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
              <div key={service.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <span className="text-sm text-muted-foreground capitalize">{service.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { 
                        setEditingService(service.id!); 
                        setServiceForm({
                          name: service.name || "",
                          category: service.category || "hair",
                          description: service.description || "",
                          price: service.price || "",
                          duration: service.duration || ""
                        });
                      }}
                      title="Edit Service"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteService(service.id!)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete Service"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                {service.description && <p className="text-sm text-muted-foreground mb-3">{service.description}</p>}
                <div className="flex gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">${service.price}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{service.duration}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setManagingTimeSlots(service.id!);
                    // Set default dates (today to 3 months from now)
                    const today = new Date();
                    const threeMonthsLater = new Date(today);
                    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
                    setTimeSlotForm({
                      start_date: today.toISOString().split('T')[0],
                      end_date: threeMonthsLater.toISOString().split('T')[0],
                      days_of_week: [],
                      start_time: "09:00",
                      end_time: "17:00",
                      interval_minutes: 30
                    });
                  }}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Create Time Slots
                </Button>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Time Slots Management Modal - NEW SYSTEM */}
      {managingTimeSlots && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create Time Slots (Up to 3 Months)</h2>
              <Button variant="ghost" size="icon" onClick={() => { 
                setManagingTimeSlots(null); 
                setTimeSlotForm({
                  start_date: "",
                  end_date: "",
                  days_of_week: [],
                  start_time: "09:00",
                  end_time: "17:00",
                  interval_minutes: 30
                });
              }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create time slots in bulk for your service. Slots can be created up to 3 months in advance.
              </p>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={timeSlotForm.start_date}
                    onChange={(e) => {
                      setTimeSlotForm({ ...timeSlotForm, start_date: e.target.value });
                      // Auto-set end date to 3 months later
                      if (e.target.value) {
                        const start = new Date(e.target.value);
                        const maxEnd = new Date(start);
                        maxEnd.setMonth(maxEnd.getMonth() + 3);
                        const currentEnd = timeSlotForm.end_date ? new Date(timeSlotForm.end_date) : null;
                        if (!currentEnd || currentEnd > maxEnd) {
                          setTimeSlotForm({ 
                            ...timeSlotForm, 
                            start_date: e.target.value,
                            end_date: maxEnd.toISOString().split('T')[0]
                          });
                        } else {
                          setTimeSlotForm({ ...timeSlotForm, start_date: e.target.value });
                        }
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Max 3 months from start)</Label>
                  <Input
                    type="date"
                    value={timeSlotForm.end_date}
                    onChange={(e) => {
                      const start = timeSlotForm.start_date ? new Date(timeSlotForm.start_date) : null;
                      const end = e.target.value ? new Date(e.target.value) : null;
                      const maxEnd = start ? new Date(start) : null;
                      if (maxEnd) maxEnd.setMonth(maxEnd.getMonth() + 3);
                      
                      if (end && maxEnd && end > maxEnd) {
                        alert("End date cannot be more than 3 months from start date");
                        return;
                      }
                      setTimeSlotForm({ ...timeSlotForm, end_date: e.target.value });
                    }}
                    min={timeSlotForm.start_date || new Date().toISOString().split('T')[0]}
                    max={timeSlotForm.start_date ? (() => {
                      const max = new Date(timeSlotForm.start_date);
                      max.setMonth(max.getMonth() + 3);
                      return max.toISOString().split('T')[0];
                    })() : undefined}
                  />
                </div>
              </div>

              {/* Days of Week */}
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="grid grid-cols-7 gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const days = [...timeSlotForm.days_of_week];
                        const dayIndex = days.indexOf(index);
                        if (dayIndex >= 0) {
                          days.splice(dayIndex, 1);
                        } else {
                          days.push(index);
                        }
                        setTimeSlotForm({ ...timeSlotForm, days_of_week: days });
                      }}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        timeSlotForm.days_of_week.includes(index)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={timeSlotForm.start_time}
                    onChange={(e) => setTimeSlotForm({ ...timeSlotForm, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={timeSlotForm.end_time}
                    onChange={(e) => setTimeSlotForm({ ...timeSlotForm, end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Interval */}
              <div className="space-y-2">
                <Label>Interval (minutes between slots)</Label>
                <Input
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={timeSlotForm.interval_minutes}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, interval_minutes: parseInt(e.target.value) || 30 })}
                />
                <p className="text-xs text-muted-foreground">
                  Example: 30 minutes = slots at 9:00, 9:30, 10:00, etc.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={async () => {
                  if (!timeSlotForm.start_date || !timeSlotForm.end_date || timeSlotForm.days_of_week.length === 0) {
                    alert("Please fill in all required fields");
                    return;
                  }

                  setCreatingSlots(true);
                  try {
                    // Convert dates to ISO format with timezone
                    const startDate = new Date(timeSlotForm.start_date + "T00:00:00Z");
                    const endDate = new Date(timeSlotForm.end_date + "T23:59:59Z");
                    
                    const res = await fetch(`http://localhost:8000/provider/services/${managingTimeSlots}/time-slots/bulk`, {
                      method: "POST",
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),
                        days_of_week: timeSlotForm.days_of_week,
                        start_time: timeSlotForm.start_time,
                        end_time: timeSlotForm.end_time,
                        interval_minutes: timeSlotForm.interval_minutes
                      }),
                    });
                    
                    if (!res.ok) {
                      const errorData = await res.json();
                      throw new Error(errorData.detail || "Failed to create time slots");
                    }
                    
                    const data = await res.json();
                    alert(`Successfully created ${data.created_count} time slots!`);
                    setManagingTimeSlots(null);
                    setTimeSlotForm({
                      start_date: "",
                      end_date: "",
                      days_of_week: [],
                      start_time: "09:00",
                      end_time: "17:00",
                      interval_minutes: 30
                    });
                    fetchServices();
                  } catch (err: any) {
                    console.error("Failed to create time slots", err);
                    alert(err.message || "Failed to create time slots");
                  } finally {
                    setCreatingSlots(false);
                  }
                }}
                className="flex-1"
                disabled={creatingSlots}
              >
                {creatingSlots ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Time Slots
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { 
                  setManagingTimeSlots(null); 
                  setTimeSlotForm({
                    start_date: "",
                    end_date: "",
                    days_of_week: [],
                    start_time: "09:00",
                    end_time: "17:00",
                    interval_minutes: 30
                  });
                }}
                disabled={creatingSlots}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

