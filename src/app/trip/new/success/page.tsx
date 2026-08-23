"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPaymentAndGenerateTripAction } from "@/app/actions/stripeActions";
import { Loader2, CheckCircle2, AlertTriangle, Sparkles, MapPin, Calendar, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const LOADING_STEPS = [
  { text: "Verifying Stripe payment...", icon: CheckCircle2, color: "text-emerald-500" },
  { text: "Analyzing your travel preferences...", icon: Heart, color: "text-rose-500" },
  { text: "Generating custom day-by-day itineraries...", icon: Sparkles, color: "text-amber-500" },
  { text: "Curating hidden gems and food lists...", icon: MapPin, color: "text-teal-500" },
  { text: "Mapping route pins and loading weather details...", icon: Calendar, color: "text-sky-500" },
];

function StripeSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef(false);

  // Rotate through loading step text messages for high-end feel
  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [error]);

  useEffect(() => {
    if (!sessionId || triggerRef.current) return;
    triggerRef.current = true;

    const verifyAndGenerate = async () => {
      try {
        const result = await verifyPaymentAndGenerateTripAction(sessionId);
        if (result.tripId) {
          router.push(`/trip/${result.tripId}`);
        } else {
          throw new Error("Did not receive a generated trip ID.");
        }
      } catch (err: any) {
        console.error("Verification failed:", err);
        setError(err.message || "An unexpected error occurred during trip generation.");
      }
    };

    verifyAndGenerate();
  }, [sessionId, router]);

  if (!sessionId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500 animate-bounce" />
        <h1 className="text-2xl font-bold">Invalid Session</h1>
        <p className="text-muted-foreground">No Stripe checkout session ID was provided.</p>
        <Button onClick={() => router.push("/trip/new")}>Go Back</Button>
      </div>
    );
  }

  const ActiveIcon = LOADING_STEPS[stepIndex].icon;

  return (
    <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 shadow-2xl text-center space-y-8 relative overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30 absolute top-0 left-0" />
      
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div 
            key="error-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight">Generation Failed</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => router.push("/trip/new")} className="w-full">
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Animated Progress Ring / Spinner */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <Loader2 className="w-20 h-20 text-primary animate-spin opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                    }}
                  className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${LOADING_STEPS[stepIndex].color}`}
                >
                  <ActiveIcon className="w-6 h-6" />
                </motion.div>
              </div>
            </div>

            {/* Step Text Indicator */}
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Creating Your Trip
              </h2>
              <div className="h-6 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="text-sm font-semibold text-muted-foreground absolute inset-0 text-center"
                  >
                    {LOADING_STEPS[stepIndex].text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress Steps Indicators */}
            <div className="flex justify-center gap-1.5 pt-4">
              {LOADING_STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === stepIndex ? "w-8 bg-primary" : idx < stepIndex ? "w-1.5 bg-emerald-500" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-background to-primary/5 flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 shadow-2xl text-center space-y-8 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground">Initializing checkout session...</span>
        </div>
      }>
        <StripeSuccessContent />
      </Suspense>
    </div>
  );
}
