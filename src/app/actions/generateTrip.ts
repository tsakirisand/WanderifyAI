"use server";

import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateItineraryData(
  destination: string,
  days: number,
  budget: string,
  travelStyle: string,
  interests: string[],
  notes: string
) {
  const prompt = `You are a senior travel agent. Create a highly detailed, personalized travel itinerary for a ${days}-day trip to ${destination}.
  
Budget: ${budget}
Travel Style: ${travelStyle}
Interests: ${interests.join(", ")}
Additional Notes: ${notes}

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseContent = response.text || '';
  
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

  const aiResult = await generateItineraryData(destination, days, budget, travelStyle, interests, notes);

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

  const newTripRef = doc(collection(db, "trips"));
  await setDoc(newTripRef, {
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
