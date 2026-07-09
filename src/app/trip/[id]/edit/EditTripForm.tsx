"use client";

import { useState, useTransition } from "react";
import { AiTripResult } from "@/components/ItineraryTimeline";
import { updateTripAction } from "@/app/actions/updateTrip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, AlertCircle } from "lucide-react";

export function EditTripForm({ tripId, userId, initialData }: { tripId: string, userId: string, initialData: AiTripResult }) {
  const [isPending, startTransition] = useTransition();
  const [jsonStr, setJsonStr] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState("");

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonStr);
      setError("");
      startTransition(async () => {
        await updateTripAction(tripId, userId, parsed);
        window.location.href = `/trip/${tripId}`;
      });
    } catch (e) {
      setError("Invalid JSON format. Please fix errors before saving.");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      <Textarea 
        value={jsonStr} 
        onChange={(e) => setJsonStr(e.target.value)} 
        className="font-mono text-sm h-[600px] bg-muted/50 rounded-xl"
      />
      <Button onClick={handleSave} disabled={isPending} className="w-full gap-2 h-12 text-lg">
        <Save className="w-5 h-5" /> {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
