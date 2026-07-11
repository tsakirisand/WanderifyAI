"use client";

import { useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { ItineraryTimeline, AiTripResult } from "@/components/ItineraryTimeline";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Share, Download, Loader2, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function TripPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

      const element = document.getElementById("itinerary-timeline");
      if (!element) return;

      // Temporarily style for clean, crisp PDF export
      element.classList.add("bg-white", "p-8", "text-black");

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      element.classList.remove("bg-white", "p-8", "text-black");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `${trip.destination.toLowerCase().replace(/[^a-z0-9]/g, "-")}-itinerary.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || isLoadingTrip) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading itinerary...</p>
      </div>
    );
  }

  if (!trip) return null;

  const aiResult = trip.aiResult as unknown as AiTripResult;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between mb-12 gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            &larr; Back to Dashboard
          </Button>
        </Link>
        <div className="flex gap-3">
          <Link href={`/trip/${trip.id}/edit`}>
            <Button variant="outline" className="gap-2 hover:bg-primary/5">
              <Edit className="w-4 h-4" /> Edit
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleShare} 
            className="gap-2 hover:bg-primary/5 min-w-[100px]"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-emerald-500" /> Copied!</>
            ) : (
              <><Share className="w-4 h-4" /> Share</>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={isExporting}
            className="gap-2 hover:bg-primary/5 min-w-[130px]"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
            ) : (
              <><Download className="w-4 h-4" /> Export PDF</>
            )}
          </Button>
        </div>
      </div>
      
      <div id="itinerary-timeline">
        <ItineraryTimeline 
          data={aiResult} 
          startDate={trip.startDate} 
          initialCoordinates={trip.coordinates} 
          tripId={trip.id} 
        />
      </div>
    </div>
  );
}
