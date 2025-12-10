import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ARTryOnPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
        <Camera className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Virtual Makeup Try-On</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Experience our AR mirror to try on lipstick, eyeshadow, and more.
        </p>
      </div>
      <Button size="lg" variant="secondary">Launch AR Camera</Button>
    </div>
  );
}

