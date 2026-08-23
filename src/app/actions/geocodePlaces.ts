"use server";

import Anthropic from "@anthropic-ai/sdk";

export async function geocodePlacesAction(destination: string, places: string[]): Promise<Record<string, { lat: number; lon: number }>> {
  if (!places || places.length === 0) return {};

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.warn("Anthropic API key is missing. Skipping geocoding.");
    return {};
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  try {
    const prompt = `You are a geocoding assistant. Given the destination "${destination}" and a list of specific sights, activities, or place names within it, find the exact latitude and longitude coordinates (WGS 84 format) for each item.

Guidelines:
1. Physical Landmarks/Places: Return the exact, real-world coordinates on land (e.g., Katikies Hotel, Fira Town, Red Beach, Santorini Airport).
2. Sea-based/Boat activities (e.g., "Catamaran Cruise", "On-Board Lunch", boat tours): Return coordinates in the appropriate sea/caldera area or the starting harbor/port (e.g., Athinios Port or Ammoudi Bay).
3. Generic descriptions (e.g., "Return to Hotel", "Hotel Relaxation", "Check-out from Hotel", "Leisurely Brunch", "Spa Treatment"): These do not represent physical sights. Do NOT locate them in inaccessible areas (like nature reserves, mountains, or the sea). Instead:
   - For hotel-related items ("Return to Hotel", "Check-out"), use the coordinates of the main hotel in the itinerary (or if unknown, the main town centre like Fira or Oia).
   - For general dining/brunch/spa, use coordinates of the nearest logical town/village (e.g., Fira or Oia).

Places to geocode:
${places.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Your response must be ONLY a valid JSON object matching this schema:
{
  "places": [
    { "name": "Place Name", "lat": 36.4633, "lon": 25.3742 }
  ]
}

Provide ONLY the raw JSON output. No markdown, no HTML, no explanation, no preamble, and no postscript.`;

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock ? textBlock.text : "{}";

    let clean = text.trim();
    if (clean.startsWith("```json")) {
      clean = clean.slice(7);
    } else if (clean.startsWith("```")) {
      clean = clean.slice(3);
    }
    if (clean.endsWith("```")) {
      clean = clean.slice(0, -3);
    }
    clean = clean.trim();

    const data = JSON.parse(clean);
    const mapping: Record<string, { lat: number; lon: number }> = {};
    
    if (data.places && Array.isArray(data.places)) {
      data.places.forEach((item: any) => {
        if (item.name && typeof item.lat === "number" && typeof item.lon === "number") {
          mapping[item.name] = { lat: item.lat, lon: item.lon };
        }
      });
    }

    return mapping;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return {};
  }
}
