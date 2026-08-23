"use client";

import { useState } from "react";
import { createCheckoutSessionAction } from "@/app/actions/stripeActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, MapPin, Calendar, Wallet, Compass, Users,
  ArrowRight, ArrowLeft, Loader2, Check,
  Utensils, Landmark, Trees, Music, ShoppingBag, Palette, Mountain, Heart,
  Plane, Globe
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const POPULAR_DESTINATIONS = [
  { name: "Paris, France", emoji: "🇫🇷" },
  { name: "Tokyo, Japan", emoji: "🇯🇵" },
  { name: "New York, USA", emoji: "🇺🇸" },
  { name: "Bali, Indonesia", emoji: "🇮🇩" },
  { name: "Barcelona, Spain", emoji: "🇪🇸" },
  { name: "Rome, Italy", emoji: "🇮🇹" },
  { name: "London, UK", emoji: "🇬🇧" },
  { name: "Dubai, UAE", emoji: "🇦🇪" },
  { name: "Bangkok, Thailand", emoji: "🇹🇭" },
  { name: "Santorini, Greece", emoji: "🇬🇷" },
  { name: "Istanbul, Turkey", emoji: "🇹🇷" },
  { name: "Amsterdam, Netherlands", emoji: "🇳🇱" },
];

const BUDGET_RANGES = [
  { label: "Budget", range: "$0 – $500", value: "budget-0-500", icon: "🎒", desc: "Hostels, street food, public transport" },
  { label: "Economy", range: "$500 – $1,000", value: "economy-500-1000", icon: "💰", desc: "Budget hotels, local restaurants" },
  { label: "Moderate", range: "$1,000 – $2,000", value: "moderate-1000-2000", icon: "⭐", desc: "Nice hotels, good dining, some tours" },
  { label: "Premium", range: "$2,000 – $3,500", value: "premium-2000-3500", icon: "💎", desc: "4-star hotels, fine dining, guided tours" },
  { label: "Luxury", range: "$3,500 – $5,000", value: "luxury-3500-5000", icon: "👑", desc: "5-star resorts, premium experiences" },
  { label: "Ultra Luxury", range: "$5,000+", value: "ultra-5000+", icon: "✨", desc: "No limits, the very best of everything" },
];

const TRAVEL_STYLES = [
  { label: "Relaxation", value: "relax", icon: "🧘", desc: "Slow pace, spa, beaches" },
  { label: "Adventure", value: "adventure", icon: "🏔️", desc: "Hiking, extreme sports, thrills" },
  { label: "Cultural", value: "cultural", icon: "🏛️", desc: "Museums, history, local life" },
  { label: "Foodie", value: "foodie", icon: "🍜", desc: "Local cuisine, street food, cooking" },
  { label: "Nightlife", value: "nightlife", icon: "🎉", desc: "Clubs, bars, live music" },
  { label: "Romantic", value: "romantic", icon: "💕", desc: "Couple getaway, sunsets, dining" },
];

const INTERESTS = [
  { label: "Food & Dining", icon: <Utensils className="w-4 h-4" /> },
  { label: "Museums & History", icon: <Landmark className="w-4 h-4" /> },
  { label: "Nature & Parks", icon: <Trees className="w-4 h-4" /> },
  { label: "Nightlife", icon: <Music className="w-4 h-4" /> },
  { label: "Shopping", icon: <ShoppingBag className="w-4 h-4" /> },
  { label: "Art & Culture", icon: <Palette className="w-4 h-4" /> },
  { label: "Adventure Sports", icon: <Mountain className="w-4 h-4" /> },
  { label: "Wellness & Spa", icon: <Heart className="w-4 h-4" /> },
];

const TRAVELER_OPTIONS = [
  { label: "Solo", value: "solo", emoji: "🧑" },
  { label: "Couple", value: "couple", emoji: "👫" },
  { label: "Family", value: "family", emoji: "👨‍👩‍👧‍👦" },
  { label: "Friends", value: "friends", emoji: "👯" },
];

const STEPS = ["Destination", "Details", "Budget", "Style", "Review"];

export default function NewTripPage() {
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("5");
  const [travelers, setTravelers] = useState("solo");
  const [budget, setBudget] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return destination.trim().length > 0;
      case 1: return parseInt(days) > 0;
      case 2: return budget.length > 0;
      case 3: return travelStyle.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) { router.push("/login"); return; }
    setIsPending(true);
    try {
      const config = {
        destination,
        days,
        budget,
        travelStyle,
        travelers,
        interests: selectedInterests,
        notes,
        startDate,
        userId: user.uid,
      };
      
      const originUrl = window.location.origin + window.location.pathname; // http://localhost:3000/trip/new
      const { url } = await createCheckoutSessionAction(config, originUrl);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Stripe did not return a checkout URL.");
      }
    } catch (error) {
      console.error(error);
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-primary/5 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            <Plane className="w-4 h-4" />
            <span className="text-sm font-medium">Wanderify Custom Planner</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Plan Your Perfect Trip
          </h1>
          <p className="text-muted-foreground">Get a customized, professionally-curated day-by-day travel guide</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${i === step ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-1 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="border-border/50 shadow-2xl shadow-primary/5 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          <CardContent className="pt-8 px-6 md:px-10 pb-8">

            {/* Step 0: Destination */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold text-lg">
                    <Globe className="w-5 h-5 text-primary" /> Where do you want to go?
                  </Label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Type a city or country..."
                    className="h-14 text-lg rounded-xl bg-background/50 focus:bg-background transition-colors"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Or pick a popular destination:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {POPULAR_DESTINATIONS.map(d => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => setDestination(d.name)}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left hover:scale-[1.02] ${
                          destination === d.name
                            ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
                            : "border-border/50 bg-background/50 text-foreground hover:border-primary/30 hover:bg-primary/5"
                        }`}
                      >
                        <span className="text-lg">{d.emoji}</span>
                        <span className="truncate">{d.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Trip Details */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold text-lg">
                    <Calendar className="w-5 h-5 text-primary" /> How many days?
                  </Label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setDays(String(Math.max(1, parseInt(days) - 1)))}
                      className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl font-bold hover:bg-muted/80 transition-colors">−</button>
                    <div className="flex-1 text-center">
                      <span className="text-5xl font-extrabold text-primary">{days}</span>
                      <p className="text-sm text-muted-foreground mt-1">{parseInt(days) === 1 ? "day" : "days"}</p>
                    </div>
                    <button type="button" onClick={() => setDays(String(Math.min(14, parseInt(days) + 1)))}
                      className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl font-bold hover:bg-muted/80 transition-colors">+</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold text-lg">
                    <Users className="w-5 h-5 text-primary" /> Who's traveling?
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TRAVELER_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTravelers(t.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                          travelers === t.value
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border/50 bg-background/50 hover:border-primary/30"
                        }`}
                      >
                        <span className="text-2xl">{t.emoji}</span>
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-semibold text-lg">
                    <Calendar className="w-5 h-5 text-primary" /> Start Date (optional)
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 bg-background/50 rounded-xl focus-visible:ring-primary focus-visible:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Budget */}
            {step === 2 && (
              <div className="space-y-4">
                <Label className="flex items-center gap-2 font-semibold text-lg">
                  <Wallet className="w-5 h-5 text-primary" /> What's your budget per person?
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BUDGET_RANGES.map(b => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBudget(b.value)}
                      className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] ${
                        budget === b.value
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                          : "border-border/50 bg-background/50 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-2xl mt-0.5">{b.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold">{b.label}</span>
                          <span className="text-sm text-primary font-bold">{b.range}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Style & Interests */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 font-semibold text-lg">
                    <Compass className="w-5 h-5 text-primary" /> Your travel style
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TRAVEL_STYLES.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setTravelStyle(s.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                          travelStyle === s.value
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border/50 bg-background/50 hover:border-primary/30"
                        }`}
                      >
                        <span className="text-2xl">{s.icon}</span>
                        <span className="text-sm font-bold">{s.label}</span>
                        <span className="text-[11px] text-muted-foreground text-center">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2 font-semibold text-lg">
                    <Sparkles className="w-5 h-5 text-primary" /> Interests <span className="text-sm font-normal text-muted-foreground">(select all that apply)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2.5">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest.label}
                        type="button"
                        onClick={() => toggleInterest(interest.label)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all hover:scale-[1.03] ${
                          selectedInterests.includes(interest.label)
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "border-border/50 bg-background/50 text-foreground hover:border-primary/30"
                        }`}
                      >
                        {interest.icon}
                        {interest.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Anything else we should know?</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. I'm vegetarian, I prefer walking tours, I need wheelchair access..."
                    className="resize-none h-20 rounded-xl bg-background/50 focus:bg-background transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <Label className="flex items-center gap-2 font-semibold text-lg">
                  <Check className="w-5 h-5 text-primary" /> Review your trip
                </Label>
                <div className="grid gap-4">
                  <ReviewRow emoji="📍" label="Destination" value={destination} />
                  <ReviewRow emoji="🗓" label="Duration" value={`${days} day${parseInt(days) > 1 ? "s" : ""}`} />
                  <ReviewRow emoji="👥" label="Travelers" value={TRAVELER_OPTIONS.find(t => t.value === travelers)?.label || travelers} />
                  <ReviewRow emoji="💰" label="Budget" value={BUDGET_RANGES.find(b => b.value === budget)?.range || budget} />
                  <ReviewRow emoji="🧭" label="Style" value={TRAVEL_STYLES.find(s => s.value === travelStyle)?.label || travelStyle} />
                  {startDate && (
                    <ReviewRow emoji="📅" label="Start Date" value={new Date(startDate).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                  )}
                  {selectedInterests.length > 0 && (
                    <ReviewRow emoji="✨" label="Interests" value={selectedInterests.join(", ")} />
                  )}
                  {notes && <ReviewRow emoji="📝" label="Notes" value={notes} />}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/30">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="gap-2 min-w-[140px]"
                  size="lg"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="gap-2 min-w-[200px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                  size="lg"
                >
                  {isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Customizing...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Create Custom Itinerary</>
                  )}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewRow({ emoji, label, value }: { emoji: string, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/30">
      <span className="text-lg">{emoji}</span>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
