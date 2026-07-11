"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Map, Calendar, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { getDestinationPhotos } from "@/app/actions/getDestinationPhoto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [tripToDelete, setTripToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      const fetchTrips = async () => {
        try {
          const q = query(collection(db, "trips"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTrips(data);
        } catch (error) {
          console.error("Error fetching trips:", error);
        } finally {
          setIsLoadingTrips(false);
        }
      };

      fetchTrips();
    }
  }, [user, loading, router]);

  const confirmDelete = async () => {
    if (!user || !tripToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "trips", tripToDelete.id));
      setTrips(prev => prev.filter(t => t.id !== tripToDelete.id));
      setTripToDelete(null);
    } catch (error) {
      console.error("Error deleting trip:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || isLoadingTrips) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Trips</h1>
          <p className="text-muted-foreground mt-1">Manage and view your saved itineraries.</p>
        </div>
        <Link href="/trip/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border/50 rounded-2xl border-dashed">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No trips yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You haven't generated any itineraries yet. Let our AI plan your first dream trip!
          </p>
          <Link href="/trip/new">
            <Button>Create your first trip</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={() => setTripToDelete(trip)} />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle>Delete Itinerary</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your trip to <strong className="text-foreground">{tripToDelete?.destination}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setTripToDelete(null)}
              disabled={isDeleting}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-initial"
            >
              {isDeleting ? "Deleting..." : "Delete Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TripCard({ trip, onDelete }: { trip: any; onDelete: () => void }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchPhoto = async () => {
      try {
        const urls = await getDestinationPhotos(trip.destination, 1);
        if (active && urls && urls.length > 0) {
          setPhotoUrl(urls[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPhoto();
    return () => {
      active = false;
    };
  }, [trip.destination]);

  return (
    <Card className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden border border-border/50 rounded-2xl h-full pt-0">
      {/* Cover Image */}
      <div className="h-44 w-full relative overflow-hidden bg-muted/20">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <Badge className="bg-primary/95 text-primary-foreground border-none font-bold text-xs py-0.5 px-2.5 rounded-full backdrop-blur-sm shadow-sm">
            {trip.days} Days
          </Badge>
          <span className="text-[11px] text-white font-bold bg-black/40 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
            {trip.budget}
          </span>
        </div>
      </div>

      <CardHeader className="pt-4 pb-2">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg font-bold line-clamp-1 text-foreground/90 group-hover:text-primary transition-colors">
            {trip.destination}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary/60" />
            <span>Planned on {new Date(trip.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Map className="w-3.5 h-3.5 text-primary/60" />
            <span className="capitalize">{trip.travelStyle} Trip</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/20 pt-3 pb-3 bg-muted/5 mt-auto">
        <Link href={`/trip/${trip.id}`} className="w-full">
          <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground rounded-xl transition-all duration-300 font-semibold text-sm">
            View Itinerary
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
