"use server";

import { adminDb } from "@/lib/firebase-admin";
import Anthropic from "@anthropic-ai/sdk";

export async function generateItineraryData(
  destination: string,
  days: number,
  budget: string,
  travelStyle: string,
  interests: string[],
  notes: string,
  startDate?: string
) {
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

  const prompt = `You are an expert travel planner. Create a highly detailed, personalized travel itinerary for a ${days}-day trip to ${destination}.

Trip Details:
- Destination: ${destination}
- Duration: ${days} days
- Budget Level: ${budget}
- Travel Style: ${travelStyle}
- Traveler Interests: ${interests.join(", ")}
${notes ? `- Special Requests / Notes: ${notes}` : ""}
${weatherContext ? `\n${weatherContext}\n` : ""}

Guidelines:
1. Provide real, operating, highly rated local attractions, hotels, restaurants, and flight routes for ${destination}.
2. Keep descriptions concise (under 25 words per description).
3. Output MUST be ONLY valid, raw JSON matching the exact schema below. Do NOT wrap in markdown formatting, do NOT include \`\`\`json codeblocks, preambles, or explanations.

JSON Schema:
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

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured. Please set ANTHROPIC_API_KEY.");
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const responseContent = textBlock ? textBlock.text : "";

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
    console.error("Failed to parse Claude response as JSON:", responseContent);
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

  // Use Admin SDK — bypasses Firestore security rules in server actions
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
