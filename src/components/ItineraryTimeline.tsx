"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, Variants } from "framer-motion";
import { 
  Sunrise, Sun, Moon, MapPin, Info, 
  Cloud, CloudRain, CloudLightning, Wind, Thermometer,
  Compass, Map, ArrowRight, Navigation, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface TripActivity {
  time?: string;
  place: string;
  description: string;
}

export interface TripDay {
  day: number;
  morning: TripActivity[];
  afternoon: TripActivity[];
  evening: TripActivity[];
  tips?: string[];
}

export interface FoodRecommendation {
  name: string;
  rating: string;
  description: string;
}

export interface FlightSuggestion {
  route: string;
  airlines: string[];
  typical_duration: string;
  estimated_cost: string;
}

export interface HotelRecommendation {
  name: string;
  rating: string;
  price_range: string;
  description: string;
}

export interface AiTripResult {
  destination: string;
  days: TripDay[];
  budget_estimate: string;
  hidden_gems: string[];
  food_recommendations: FoodRecommendation[];
  flight_suggestions?: FlightSuggestion[];
  hotel_recommendations?: HotelRecommendation[];
  summary: string;
}

interface ItineraryTimelineProps {
  data: AiTripResult;
  startDate?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// Consistent hashing to make places stay in the same visual mock-map coordinate offsets
function hashStringToCoordinates(str: string, index: number) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.abs((hash + index * 145) % 65) + 18;
  const y = Math.abs((hash * 33 + index * 265) % 55) + 22;
  return { x, y };
}

// Fallback weather generator based on destination name and day
function getFallbackWeather(destination: string, day: number) {
  const dest = destination.toLowerCase();
  const baseTemp = dest.includes("tokyo") ? 20 
                 : dest.includes("paris") ? 18 
                 : dest.includes("rome") ? 25 
                 : dest.includes("bali") || dest.includes("phuket") || dest.includes("bangkok") ? 31
                 : dest.includes("london") ? 15
                 : dest.includes("new york") ? 22
                 : 24;
  
  const hash = Math.abs((destination.length + day * 9) % 5);
  const conditions = [
    { text: "Sunny", icon: Sun, tempDiff: 3, humidity: 40, wind: 6 },
    { text: "Partly Cloudy", icon: Cloud, tempDiff: 1, humidity: 52, wind: 10 },
    { text: "Passing Showers", icon: CloudRain, tempDiff: -2, humidity: 82, wind: 16 },
    { text: "Windy", icon: Wind, tempDiff: -1, humidity: 48, wind: 24 },
    { text: "Heavy Rain", icon: CloudLightning, tempDiff: -4, humidity: 88, wind: 18 },
  ];
  
  const cond = conditions[hash];
  return {
    lat: 35.6762, 
    lon: 139.6503,
    condition: cond.text,
    icon: cond.icon,
    temp: baseTemp + cond.tempDiff,
    humidity: cond.humidity,
    wind: cond.wind,
    isReal: false,
  };
}

import { getWeatherAction } from "@/app/actions/getWeather";

function getIconForConditionText(text: string) {
  const t = text.toLowerCase();
  if (t.includes("thunder") || t.includes("storm")) return CloudLightning;
  if (t.includes("rain") || t.includes("drizzle") || t.includes("shower") || t.includes("sleet")) return CloudRain;
  if (t.includes("cloud") || t.includes("overcast") || t.includes("mist") || t.includes("fog") || t.includes("haze")) return Cloud;
  if (t.includes("wind") || t.includes("gale") || t.includes("breeze")) return Wind;
  return Sun;
}

export function ItineraryTimeline({ data, startDate }: ItineraryTimelineProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [hoveredPin, setHoveredPin] = useState<{ name: string; desc: string; time?: string; type: string } | null>(null);

  // Real weather API state
  const [realWeather, setRealWeather] = useState<any>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Leaflet map state
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  const selectedDayData = useMemo(() => {
    return data.days.find((d) => d.day === activeDay) || data.days[0];
  }, [data.days, activeDay]);

  // Compute active date for weather fetching
  const activeDate = useMemo(() => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setDate(d.getDate() + (activeDay - 1));
    return d;
  }, [startDate, activeDay]);

  // Fetch weather forecast or historical data using WeatherAPI action
  useEffect(() => {
    if (!activeDate) {
      setRealWeather(null);
      return;
    }

    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const dateStr = activeDate.toISOString().split("T")[0];
        const res = await getWeatherAction(data.destination, dateStr);
        if (res) {
          setRealWeather({
            lat: res.lat,
            lon: res.lon,
            condition: res.condition,
            icon: getIconForConditionText(res.condition),
            temp: res.temp,
            humidity: res.humidity,
            wind: res.wind,
            isReal: true,
            isHistorical: res.isHistorical,
          });
        } else {
          setRealWeather(null);
        }
      } catch (err) {
        console.error("WeatherAPI fetch action failed:", err);
        setRealWeather(null);
      } finally {
        setIsLoadingWeather(false);
      }
    };
    
    fetchWeather();
  }, [activeDate, data.destination]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else if ((window as any).L) {
      setLeafletLoaded(true);
    }
  }, []);

  // Determine active weather details
  const activeWeather = useMemo(() => {
    if (realWeather) return realWeather;
    return getFallbackWeather(data.destination, activeDay);
  }, [realWeather, data.destination, activeDay]);

  // Combine day activities to display on the interactive map
  const mapPins = useMemo(() => {
    const pins: { name: string; desc: string; time?: string; type: string; x: number; y: number }[] = [];
    if (!selectedDayData) return pins;

    selectedDayData.morning.forEach((act, idx) => {
      const { x, y } = hashStringToCoordinates(act.place, idx + 1);
      pins.push({ name: act.place, desc: act.description, time: act.time || "Morning", type: "Morning", x, y });
    });

    selectedDayData.afternoon.forEach((act, idx) => {
      const { x, y } = hashStringToCoordinates(act.place, idx + 4);
      pins.push({ name: act.place, desc: act.description, time: act.time || "Afternoon", type: "Afternoon", x, y });
    });

    selectedDayData.evening.forEach((act, idx) => {
      const { x, y } = hashStringToCoordinates(act.place, idx + 7);
      pins.push({ name: act.place, desc: act.description, time: act.time || "Evening", type: "Evening", x, y });
    });

    return pins;
  }, [selectedDayData]);

  // Render Leaflet Map
  useEffect(() => {
    const L = (window as any).L;
    if (!leafletLoaded || !L || !activeWeather?.lat || !activeWeather?.lon) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const mapContainer = document.getElementById("leaflet-map-container");
    if (!mapContainer) return;

    const map = L.map("leaflet-map-container", {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([activeWeather.lat, activeWeather.lon], 13);

    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const latlngs: any[] = [];
    const createCustomIcon = (num: number) => L.divIcon({
      html: `<div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-8 w-8 rounded-full bg-primary/20 animate-ping"></span>
              <div class="w-6 h-6 rounded-full border-2 border-background bg-primary shadow-md flex items-center justify-center text-[10px] font-extrabold text-primary-foreground leading-none">${num}</div>
             </div>`,
      className: "custom-leaflet-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    mapPins.forEach((pin, i) => {
      const latOffset = (pin.y - 50) * 0.0008;
      const lonOffset = (pin.x - 50) * 0.0008;
      const pinLat = activeWeather.lat + latOffset;
      const pinLon = activeWeather.lon + lonOffset;
      latlngs.push([pinLat, pinLon]);

      const marker = L.marker([pinLat, pinLon], { icon: createCustomIcon(i + 1) }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px; max-width: 200px;">
          <strong style="color: #6366f1; font-weight: 700;">${i + 1}. ${pin.name}</strong>
          <div style="font-size: 10px; color: #888; font-weight: 600; margin-top: 1px;">${pin.time || ""}</div>
          <p style="margin: 4px 0 0 0; color: #555; line-height: 1.3;">${pin.desc}</p>
        </div>
      `);
    });

    if (latlngs.length > 1) {
      L.polyline(latlngs, {
        color: "#6366f1",
        weight: 3.5,
        dashArray: "7, 5",
        opacity: 0.85
      }).addTo(map);

      map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [40, 40] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, activeWeather?.lat, activeWeather?.lon, mapPins]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Header Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {data.destination} Itinerary
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
          {data.summary}
        </p>
        <div className="flex flex-wrap gap-2.5 pt-2">
          <Badge variant="secondary" className="px-3.5 py-1 text-sm rounded-full bg-primary/5 text-primary border border-primary/10">
            💰 {data.budget_estimate}
          </Badge>
          <Badge variant="secondary" className="px-3.5 py-1 text-sm rounded-full bg-primary/5 text-primary border border-primary/10">
            🗓 {data.days.length} Days
          </Badge>
          {startDate && (
            <Badge variant="secondary" className="px-3.5 py-1 text-sm rounded-full bg-primary/5 text-primary border border-primary/10">
              📅 Start: {new Date(startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Main Grid: Timeline + Widgets Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Timeline */}
        <div className="lg:col-span-7 space-y-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent"
          >
            {data.days.map((dayData) => {
              const isActive = activeDay === dayData.day;
              let dayDateStr = "";
              if (startDate) {
                const dayDate = new Date(startDate);
                dayDate.setMinutes(dayDate.getMinutes() + dayDate.getTimezoneOffset());
                dayDate.setDate(dayDate.getDate() + (dayData.day - 1));
                dayDateStr = dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }

              return (
                <motion.div 
                  key={dayData.day} 
                  variants={itemVariants} 
                  onClick={() => setActiveDay(dayData.day)}
                  className={`relative flex items-start justify-between group cursor-pointer transition-all duration-300 ${
                    isActive ? "scale-[1.01]" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 relative z-10 transition-all duration-300 ${
                    isActive 
                      ? "border-primary bg-primary text-primary-foreground scale-110" 
                      : "border-background bg-card text-muted-foreground group-hover:border-primary/40"
                  }`}>
                    <span className="font-bold text-sm">{dayData.day}</span>
                  </div>

                  {/* Day Content Card */}
                  <div className={`w-[calc(100%-3.5rem)] bg-card border rounded-2xl p-6 transition-all duration-300 ${
                    isActive 
                      ? "border-primary/40 shadow-lg shadow-primary/5 bg-primary/[0.01]" 
                      : "border-border/50 shadow-sm hover:border-border"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <h3 className="text-2xl font-bold leading-tight">
                          Day {dayData.day}
                        </h3>
                        {dayDateStr && (
                          <p className="text-xs font-semibold text-primary">{dayDateStr}</p>
                        )}
                      </div>
                      {isActive && (
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 animate-pulse">
                          Active View
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <TimeSection title="Morning" icon={<Sunrise className="w-5 h-5 text-orange-400" />} activities={dayData.morning} destination={data.destination} />
                      <TimeSection title="Afternoon" icon={<Sun className="w-5 h-5 text-yellow-500" />} activities={dayData.afternoon} destination={data.destination} />
                      <TimeSection title="Evening" icon={<Moon className="w-5 h-5 text-indigo-400" />} activities={dayData.evening} destination={data.destination} />
                      
                      {dayData.tips && dayData.tips.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <h4 className="flex items-center gap-2 font-semibold text-xs text-primary/95 mb-2">
                            <Info className="w-4 h-4" /> Daily Notes
                          </h4>
                          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                            {dayData.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Column: Sticky Sidebar Widgets */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Destination Weather Card */}
          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden shadow-md py-0">
            <CardHeader className="pt-5 pb-3 border-b border-border/10 bg-primary/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <activeWeather.icon className="w-5 h-5 text-primary" /> Destination Weather
                </CardTitle>
                <div className="flex gap-2">
                  {isLoadingWeather ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : activeWeather.isReal ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">
                      {activeWeather.isHistorical ? "Typical weather" : "Real weather"}
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-500 border-none font-bold text-[10px]">
                      Simulated
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {activeDate && (
                    <p className="text-xs font-bold text-muted-foreground">
                      {activeDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  <p className="text-3xl font-extrabold tracking-tight flex items-start">
                    {activeWeather.temp}<span className="text-lg font-medium text-muted-foreground mt-0.5">°C</span>
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">{activeWeather.condition}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <activeWeather.icon className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Humidity</p>
                    <p className="text-sm font-bold">{activeWeather.humidity}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Wind Speed</p>
                    <p className="text-sm font-bold">{activeWeather.wind} km/h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Route Map */}
          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden shadow-md py-0">
            <CardHeader className="pt-5 pb-3 border-b border-border/10 bg-primary/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" /> Interactive Route Map
                </CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none">
                  Live View
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              <div className="aspect-[4/3] bg-muted/20 relative overflow-hidden group">
                {/* Real Leaflet Map Container */}
                <div id="leaflet-map-container" className="absolute inset-0 h-full w-full z-10" />

                {!leafletLoaded && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-muted/20 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">Loading Map tiles...</span>
                  </div>
                )}
              </div>

              {/* Map Footer showing destinations order */}
              <div className="p-4 bg-muted/25 border-t border-border/10 space-y-2 relative z-20">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Today's Route Path</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  {mapPins.map((pin, i) => (
                    <div key={pin.name} className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground/90 max-w-[100px] truncate">{pin.name}</span>
                      {i < mapPins.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/45 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid: Flight & Hotel Suggestions */}
      {(data.flight_suggestions || data.hotel_recommendations) && (
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {data.flight_suggestions && data.flight_suggestions.length > 0 && (
            <Card className="bg-card/50 backdrop-blur border-border/50 rounded-2xl overflow-hidden shadow-sm py-0">
              <CardHeader className="bg-primary/5 pt-5 pb-4 border-b border-border/10">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  ✈️ Flight Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  {data.flight_suggestions.map((flight, idx) => (
                    <div key={idx} className="flex flex-col gap-1 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-bold text-foreground text-sm">{flight.route}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px] py-0.5">
                          {flight.estimated_cost}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Airlines: <span className="font-semibold text-foreground/80">{flight.airlines.join(", ")}</span> • Duration: <span className="font-semibold text-foreground/80">{flight.typical_duration}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.hotel_recommendations && data.hotel_recommendations.length > 0 && (
            <Card className="bg-card/50 backdrop-blur border-border/50 rounded-2xl overflow-hidden shadow-sm py-0">
              <CardHeader className="bg-primary/5 pt-5 pb-4 border-b border-border/10">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  🏨 Hotel Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  {data.hotel_recommendations.map((hotel, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 border-b border-border/20 pb-3.5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground text-sm">{hotel.name}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ", " + data.destination)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
                            title="Open in Google Maps"
                          >
                            <Navigation className="w-3 h-3 rotate-45" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-semibold">{hotel.price_range}</span>
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none font-bold text-[10px] py-0 px-1.5">
                            ★ {hotel.rating.replace("★", "").trim()}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{hotel.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Grid Footer: Hidden Gems & Food Recommendations */}
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="bg-card/50 backdrop-blur border-border/50 rounded-2xl overflow-hidden shadow-sm py-0">
          <CardHeader className="bg-primary/5 pt-5 pb-4 border-b border-border/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Hidden Gems
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <ul className="space-y-3">
              {data.hidden_gems.map((gem, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2.5">
                  <span className="text-primary/70 mt-0.5 font-bold">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground leading-relaxed">{gem}</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem + ", " + data.destination)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
                      title="Open in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5 rotate-45" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 rounded-2xl overflow-hidden shadow-sm py-0">
          <CardHeader className="bg-primary/5 pt-5 pb-4 border-b border-border/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              🍽️ Food Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <ul className="space-y-4">
              {data.food_recommendations.map((food, idx) => (
                <li key={idx} className="text-sm flex flex-col gap-1 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{food.name}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.name + ", " + data.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
                        title="Open in Google Maps"
                      >
                        <Navigation className="w-3 h-3 rotate-45" />
                      </a>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none font-bold text-[10px] py-0 px-1.5 shrink-0">
                      ★ {food.rating.replace("★", "").trim()}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">{food.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function TimeSection({ title, icon, activities, destination }: { title: string, icon: React.ReactNode, activities: TripActivity[], destination: string }) {
  if (!activities || activities.length === 0) return null;
  return (
    <div className="space-y-3.5">
      <h4 className="flex items-center gap-2 font-bold text-[14px] border-b border-border/20 pb-2 text-foreground/90">
        {icon} {title}
      </h4>
      <div className="space-y-4">
        {activities.map((act, i) => (
          <div key={i} className="flex gap-3.5 relative pl-2 group">
            <div className="absolute left-[-16px] top-1.5 w-1.5 h-1.5 rounded-full bg-border/80 group-hover:bg-primary transition-colors" />
            <div className="flex-1 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5 group/link">
                  <span className="font-semibold text-foreground text-sm leading-none">{act.place}</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.place + ", " + destination)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/60 hover:text-primary transition-colors p-0.5"
                    title="Open in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                  </a>
                </div>
                {act.time && <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{act.time}</span>}
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">{act.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
