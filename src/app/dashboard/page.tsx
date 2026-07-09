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
            <Card key={trip.id} className="flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10" />
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-xl line-clamp-1">{trip.destination}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTripToDelete(trip)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary/70" /> 
                    <span className="font-medium text-foreground">{trip.days} Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-primary/70" /> 
                    <span className="capitalize">{trip.travelStyle} • {trip.budget}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/40 pt-4 mt-auto bg-muted/20">
                <Link href={`/trip/${trip.id}`} className="w-full">
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">View Itinerary</Button>
                </Link>
              </CardFooter>
            </Card>
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
