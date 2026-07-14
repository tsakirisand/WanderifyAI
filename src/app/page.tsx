"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Map, Calendar, ArrowRight, Star, Compass, 
  ChevronDown, HelpCircle, Globe, Users, Award 
} from "lucide-react";

const STATS = [
  { label: "Trips Created", value: "18,400+", icon: Sparkles, desc: "Personalized itineraries" },
  { label: "Destinations Covered", value: "160+", icon: Globe, desc: "Cities and countries worldwide" },
  { label: "Satisfaction Rate", value: "99.4%", icon: Star, desc: "Rated by our happy travelers" },
];

const REVIEWS = [
  {
    name: "Alex M.",
    location: "London, UK",
    initials: "AM",
    text: "Wanderify saved me days of planning for my Tokyo trip. The interactive map and weather forecasts made navigation so easy!",
    rating: 5.0,
    relativeTime: "2 days ago",
    guide: "Local Guide • 42 reviews"
  },
  {
    name: "Elena R.",
    location: "Madrid, Spain",
    initials: "ER",
    text: "The hotel options and restaurant suggestions matched my budget perfectly. Highly recommended!",
    rating: 4.8,
    relativeTime: "1 week ago",
    guide: "Local Guide • 18 reviews"
  },
  {
    name: "David K.",
    location: "Berlin, Germany",
    initials: "DK",
    text: "I love the clean PDF export feature. I kept it offline on my phone during the entire trip. Definitely worth the $1.99!",
    rating: 5.0,
    relativeTime: "3 weeks ago",
    guide: "Local Guide • 65 reviews"
  },
  {
    name: "Sophia L.",
    location: "Rome, Italy",
    initials: "SL",
    text: "Generating itineraries is super fast. I used it for a weekend trip to Florence, and the hidden gems were spot-on!",
    rating: 4.9,
    relativeTime: "1 month ago",
    guide: "Local Guide • 27 reviews"
  },
  {
    name: "Marc D.",
    location: "Paris, France",
    initials: "MD",
    text: "Finally, a travel planner that gives accurate weather forecasts and real Google Maps deep links. Absolute game-changer.",
    rating: 4.8,
    relativeTime: "1 month ago",
    guide: "Local Guide • 12 reviews"
  },
  {
    name: "Ji-Min H.",
    location: "Seoul, South Korea",
    initials: "JH",
    text: "The Stripe payment is fast and secure. Receiving the PDF itinerary directly in my email inbox is extremely convenient.",
    rating: 4.7,
    relativeTime: "2 months ago",
    guide: "Local Guide • 31 reviews"
  },
];

const FAQS = [
  {
    question: "How is my itinerary created?",
    answer: "Our advanced travel agent engine analyzes your destination, interests, trip duration, budget, and notes. It then dynamically researches places, timings, and routing paths to build an optimized day-by-day travel plan tailormade for you.",
  },
  {
    question: "Can I customize the trip after it is generated?",
    answer: "Absolutely! You can easily edit any activities, times, and notes, or add custom destinations to your timeline so it matches your travel plans perfectly.",
  },
  {
    question: "Does the app support real weather forecasts?",
    answer: "Yes! If you select a travel start date during trip creation, we integrate directly with WeatherAPI.com to fetch live forecasts for nearby dates or historical typical conditions for future/past trips.",
  },
  {
    question: "How do I export my itinerary?",
    answer: "You can download your entire travel plan as a beautifully formatted PDF directly from the trip page, making it easy to save on your phone or print for offline use.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (carouselRef.current) {
        setCarouselWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };
    handleResize();
    // Wait briefly for elements to render to get accurate dimensions
    const timer = setTimeout(handleResize, 100);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12 text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide">Smart Travel Planning</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Your Dream Trip, <br />
            <span className="text-foreground">Planned in Seconds</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 leading-relaxed">
            Stop spending hours researching. Tell us your destination, budget, and interests, and receive a complete, personalized day-by-day itinerary instantly.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base font-semibold group rounded-xl shadow-lg shadow-primary/25">
                Create your first trip
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl backdrop-blur-sm">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof & Stats Section */}
      <section className="py-16 px-4 bg-muted/20 border-t border-border/20">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.label}
                  className="flex flex-col items-center text-center p-6 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</h3>
                  <p className="text-sm font-semibold text-muted-foreground mt-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">{stat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Examples & Showcase Section */}
      <section className="py-24 px-4 bg-muted/30 border-t border-border/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Popular Generated Itineraries</h2>
            <p className="text-muted-foreground text-base">See what other travelers are planning with Wanderify across the globe.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ExampleTripCard
              destination="Tokyo, Japan"
              days={7}
              style="Adventure & Food"
              budget="Moderate"
              rating={4.9}
              desc="A complete exploration of modern Tokyo, from historic temples in Asakusa to food tours in Shibuya and day trips to Mt. Fuji."
              tags={["Temples", "Sushi Tour", "Shibuya Crossing"]}
              image="https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=600&q=80"
            />
            <ExampleTripCard
              destination="Paris, France"
              days={5}
              style="Romance & Arts"
              budget="Luxury"
              rating={4.8}
              desc="Experience the best of the City of Light. Includes private Louvre tours, Seine river cruises, and cozy bistro recommendations."
              tags={["Louvre", "Seine Cruise", "Eiffel Tower"]}
              image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80"
            />
            <ExampleTripCard
              destination="Rome, Italy"
              days={6}
              style="History & Culture"
              budget="Budget-Friendly"
              rating={4.9}
              desc="Walk the footsteps of Roman emperors. Enjoy day-by-day walks covering the Colosseum, Vatican City, and secret local pizzerias."
              tags={["Colosseum", "Trevi Fountain", "Vatican"]}
              image="https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Map className="w-8 h-8 text-primary" />}
              title="Personalized Destinations"
              description="Discover hidden gems and local favorites tailored to your unique travel style and interests."
            />
            <FeatureCard 
              icon={<Calendar className="w-8 h-8 text-primary" />}
              title="Day-by-Day Itineraries"
              description="Get perfectly structured daily plans with morning, afternoon, and evening activities."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-primary" />}
              title="AI Recommendations"
              description="Smart suggestions for food, attractions, and budget tips to make your trip unforgettable."
            />
          </div>
        </div>
      </section>

      {/* Testimonials / Reviews Section */}
      <section className="py-24 px-4 bg-background border-t border-border/20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5" /> Reviews
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">What Travelers Say</h2>
            <p className="text-muted-foreground text-sm mt-2">Read real experiences from users who planned their dream trips with Wanderify.</p>
          </div>

          <motion.div 
            ref={carouselRef} 
            className="cursor-grab active:cursor-grabbing overflow-hidden w-full"
          >
            <motion.div 
              drag="x" 
              dragConstraints={{ right: 0, left: -carouselWidth }}
              className="flex gap-6 w-max px-4 py-2 select-none"
            >
              {REVIEWS.map((review, idx) => (
                <div 
                  key={idx} 
                  className="w-[280px] sm:w-[320px] md:w-[350px] bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < Math.round(review.rating) ? "fill-amber-400 stroke-amber-400 animate-pulse" : "text-muted-foreground/20"}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-foreground/80">{review.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground/75">• {review.relativeTime}</span>
                      </div>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-sm italic leading-relaxed pointer-events-none">
                      "{review.text}"
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-3 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                      {review.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{review.name}</h4>
                      <p className="text-[10px] font-semibold text-amber-600/90">{review.guide}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-4 bg-muted/20 border-t border-border/20">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <HelpCircle className="w-3.5 h-3.5" /> FAQ
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-sm mt-2">Everything you need to know about Wanderify.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-base md:text-lg text-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ml-4 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-0 text-sm md:text-base text-muted-foreground leading-relaxed border-t border-border/20">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExampleTripCard({ 
  destination, days, style, budget, rating, desc, tags, image 
}: { 
  destination: string, days: number, style: string, budget: string, rating: number, desc: string, tags: string[], image: string 
}) {
  return (
    <div className="group flex flex-col rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
      <div className="relative h-48 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={image} 
          alt={destination} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
          <span>{rating}</span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{destination}</h3>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{days} Days</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">{desc}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-primary">
            <Compass className="w-3.5 h-3.5" />
            <span>{style} • {budget}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/60 px-2 py-1 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
