"use server";

import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenAI } from "@google/genai";

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  contents: string,
  options?: { tools?: any[]; responseMimeType?: string }
) {
  const modelsToTry = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    // 1. Try with tools if specified
    if (options?.tools) {
      try {
        const config: any = { tools: options.tools };
        if (options?.responseMimeType) config.responseMimeType = options.responseMimeType;
        return await ai.models.generateContent({ model, contents, config });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${model} WITH tools failed (${msg}). Trying WITHOUT tools...`);
        lastError = err;
      }
    }

    // 2. Try without tools
    try {
      const config: any = {};
      if (options?.responseMimeType) config.responseMimeType = options.responseMimeType;
      return await ai.models.generateContent({ model, contents, config });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Model ${model} WITHOUT tools failed (${msg}). Trying next model...`);
      lastError = err;
    }
  }
  throw (lastError instanceof Error ? lastError : new Error("Failed to generate content with Gemini AI."));
}

export async function generateItineraryData(
  destination: string,
  days: number,
  budget: string,
  travelStyle: string,
  interests: string[],
  notes: string,
  startDate?: string
) {
  const ai = getAIClient();

  let weatherContext = "";
  if (startDate) {
    try {
      const { getWeatherAction } = await import("./getWeather");
      const weather = await getWeatherAction(destination, startDate);
      if (weather) {
        weatherContext = `The real-time/historical weather forecast/average for ${destination} starting on ${startDate} is:
- High/Typical Temp: ${weather.temp}°C
- Condition: ${weather.condition}
- Humidity: ${weather.humidity}%
- Wind: ${weather.wind} kph
Please customize the activities, recommendations, and tips based on this weather context (e.g. suggesting indoor activities if it is rainy, advising proper clothing, etc.).`;
      }
    } catch (error) {
      console.error("Failed to fetch weather for prompt grounding:", error);
    }
  }

  const researchPrompt = `You are a senior travel agent. Research and plan a highly detailed, personalized travel itinerary for a ${days}-day trip to ${destination}.
  
Budget: ${budget}
Travel Style: ${travelStyle}
Interests: ${interests.join(", ")}
Additional Notes: ${notes}
${weatherContext ? `\n${weatherContext}\n` : ""}

Use Google Search grounding to find real, currently operating and highly rated local attractions, hotels, restaurants, and flight routes. Do not invent or hallucinate names. All names, ratings, and descriptions must be based on real-world data.

Provide a detailed day-by-day plan, hotel recommendations, food recommendations, and flight suggestions.`;

  const researchResponse = await generateContentWithFallback(ai, researchPrompt, {
    tools: [{ googleSearch: {} }],
  });

  const researchResult = researchResponse.text || "";

  const formatPrompt = `You are a data formatting assistant. Your job is to convert the following travel research notes into a structured JSON itinerary according to the schema.
  
Research Notes:
${researchResult}

Keep all descriptions concise (under 25 words per description) to ensure it fits in the response size limits.
Your output MUST be exactly valid JSON, without any markdown formatting (\`\`\`json), without any preamble, and without any postscript. Provide ONLY the JSON object. Use exactly this schema:
{
  "destination": "${destination}",
  "days": [
    {
      "day": 1,
      "morning": [ { "time": "09:00", "place": "Place Name", "description": "Short description" } ],
      "afternoon": [ { "time": "14:00", "place": "Place Name", "description": "Short description" } ],
      "evening": [ { "time": "19:00", "place": "Place Name", "description": "Short description" } ],
      "tips": ["Tip 1", "Tip 2"]
    }
  ],
  "budget_estimate": "Estimated total budget based on the style",
  "hidden_gems": ["Gem 1", "Gem 2"],
  "food_recommendations": [
    { "name": "Restaurant Name", "rating": "4.8 ★", "description": "Short culinary description and recommendation" }
  ],
  "flight_suggestions": [
    { "route": "Origin city to destination route option", "airlines": ["Airlines name"], "typical_duration": "E.g. 8h direct", "estimated_cost": "Estimated typical ticket price range" }
  ],
  "hotel_recommendations": [
    { "name": "Recommended Hotel Name", "rating": "4.7 ★", "price_range": "E.g. $120 - $180 / night", "description": "Short description of why it fits the travel style" }
  ],
  "summary": "A 2-3 sentence engaging summary of the trip"
}`;

  const response = await generateContentWithFallback(ai, formatPrompt, {
    responseMimeType: "application/json",
  });

  const responseContent = response.text || "";
  
  let cleanContent = responseContent.trim();
  if (cleanContent.startsWith("```json")) {
    cleanContent = cleanContent.slice(7);
  } else if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith("```")) {
    cleanContent = cleanContent.slice(0, -3);
  }
  cleanContent = cleanContent.trim();

  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("Failed to parse AI response as JSON", responseContent);
    throw new Error("Failed to generate itinerary. Please try again.");
  }
}

export async function generateTripAction(formData: FormData, userId: string) {
  if (!userId) throw new Error("Unauthorized");

  const destination = formData.get("destination") as string;
  const days = parseInt(formData.get("days") as string, 10);
  const budget = formData.get("budget") as string;
  const travelStyle = formData.get("travelStyle") as string;
  const interests = formData.getAll("interests") as string[];
  const notes = formData.get("notes") as string;
  const startDate = formData.get("startDate") as string;

  const aiResult = await generateItineraryData(destination, days, budget, travelStyle, interests, notes, startDate);

  // Extract unique places to geocode once at trip creation time
  const places: string[] = [];
  if (aiResult && aiResult.days) {
    aiResult.days.forEach((day: any) => {
      if (day.morning) day.morning.forEach((a: any) => places.push(a.place));
      if (day.afternoon) day.afternoon.forEach((a: any) => places.push(a.place));
      if (day.evening) day.evening.forEach((a: any) => places.push(a.place));
    });
  }

  let coordinates = {};
  try {
    const { geocodePlacesAction } = await import("./geocodePlaces");
    coordinates = await geocodePlacesAction(destination, Array.from(new Set(places)));
  } catch (error) {
    console.error("Geocoding failed during generation:", error);
  }

  if (!adminDb) {
    throw new Error("Firebase Admin SDK is not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel.");
  }

  const newTripRef = adminDb.collection("trips").doc();
  await newTripRef.set({
    userId,
    destination,
    days,
    budget,
    travelStyle,
    interests,
    aiResult,
    coordinates,
    startDate: startDate || null,
    createdAt: new Date().toISOString(),
  });

  return newTripRef.id;
}
