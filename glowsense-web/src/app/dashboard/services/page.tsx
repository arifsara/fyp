import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Find Beauty Services</h1>
        <p className="text-muted-foreground">Browse and book top-rated beauty professionals near you.</p>
      </div>
      
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input className="pl-10 h-12" placeholder="Search for hairstylists, dermatologists, etc." />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Placeholders for service cards */}
         {[1, 2, 3, 4, 5, 6].map((i) => (
           <div key={i} className="h-64 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20 flex items-center justify-center text-muted-foreground">
             Service Card Placeholder {i}
           </div>
         ))}
      </div>
    </div>
  );
}

