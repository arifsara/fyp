import { ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalysisPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <ScanFace className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI Skin Analysis</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Upload a photo or use your camera to get a personalized skin assessment.
        </p>
      </div>
      <Button size="lg" className="bg-primary">Start New Scan</Button>
    </div>
  );
}

