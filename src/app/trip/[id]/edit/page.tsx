"use client";

import { useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { AiTripResult } from "@/components/ItineraryTimeline";
import { EditTripForm } from "./EditTripForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function EditTripPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      const fetchTrip = async () => {
        try {
          const docRef = doc(db, "trips", id);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            notFound();
            return;
          }
          
          const data = docSnap.data();
          if (data.userId !== user.uid) {
            router.push("/dashboard");
            return;
          }
          
          setTrip({ id: docSnap.id, ...data });
        } catch (error) {
          console.error("Error fetching trip:", error);
        } finally {
          setIsLoadingTrip(false);
        }
      };

      fetchTrip();
    }
  }, [user, loading, id, router]);

  if (loading || isLoadingTrip) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading editor...</p>
      </div>
    );
  }

  if (!trip) return null;

  const aiResult = trip.aiResult as unknown as AiTripResult;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Itinerary</h1>
          <p className="text-muted-foreground">Advanced JSON Editor for your trip to {trip.destination}</p>
        </div>
        <Link href={`/trip/${trip.id}`}>
          <Button variant="ghost">Cancel</Button>
        </Link>
      </div>

      <EditTripForm tripId={trip.id} userId={user!.uid} initialData={aiResult} />
    </div>
  );
}
