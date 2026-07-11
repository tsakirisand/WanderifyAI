"use server";

function getQueryCandidates(query: string, destination: string): string[] {
  const candidates: string[] = [];
  
  // Clean up the query string
  const clean = (str: string) => {
    return str
      .replace(/\b(arrival at|departure from|check-in|check-out|return to|hotel relaxation in|dinner in|lunch & relaxation|visit to|explore|exploration|trip to|day at|farewell dinner at a|farewell dinner at|lunch at|breakfast at|local dinner at|relax at)\b/gi, "")
      .replace(/\(.*?\)/g, "") // Remove parentheses details like (JTR)
      .trim();
  };

  const cleanedQuery = clean(query);
  const cleanedDest = clean(destination);

  // 1. Specific combination: query + destination (e.g., "Canaves Oia Epitome Santorini")
  if (cleanedQuery && cleanedDest && cleanedQuery !== cleanedDest) {
    candidates.push(`${cleanedQuery} ${cleanedDest}`);
  }

  // 2. The cleaned query itself (e.g., "Canaves Oia Epitome")
  if (cleanedQuery) {
    candidates.push(cleanedQuery);
  }

  // 3. The cleaned destination itself (e.g., "Santorini")
  if (cleanedDest) {
    candidates.push(cleanedDest);
    // Try first segment of destination if it contains commas (e.g., "Santorini" from "Santorini, Greece")
    if (cleanedDest.includes(",")) {
      const parts = cleanedDest.split(",").map(p => p.trim());
      if (parts[0]) {
        candidates.push(parts[0]);
      }
    }
  }

  // Deduplicate and filter out empty strings
  return Array.from(new Set(candidates)).filter(c => c.length > 0);
}

export async function getDestinationPhotos(query: string, count: number = 5, destination: string = ""): Promise<string[]> {
  try {
    const candidates = getQueryCandidates(query, destination);
    
    // Fetch all candidates in parallel to optimize load speed
    const fetches = candidates.map(async (candidate) => {
      const formattedQuery = encodeURIComponent(candidate);
      const res = await fetch(`https://unsplash.com/s/photos/${formattedQuery}`, {
        next: { revalidate: 86400 } // Cache for 24 hours
      });
      if (!res.ok) return { candidate, urls: [] };
      const html = await res.text();
      
      // Check if this query returned 0 results
      const hasZeroResults = html.includes("over 0 of the best free") || html.includes("Find over 0 of the best");
      if (hasZeroResults) {
        return { candidate, urls: [] };
      }
      
      // Match unsplash photo URLs
      const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-?%=&_]+/g;
      const matches = html.match(regex) || [];
      const urls: string[] = [];
      const ids = new Set<string>();
      
      for (const match of matches) {
        const cleanMatch = match.replace(/&amp;/g, "&");
        const idMatch = cleanMatch.match(/photo-([a-zA-Z0-9-]+)/);
        if (idMatch && idMatch[1]) {
          const id = idMatch[1];
          if (!ids.has(id)) {
            ids.add(id);
            urls.push(`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`);
          }
        }
        if (urls.length >= count) break;
      }
      return { candidate, urls };
    });
    
    const results = await Promise.all(fetches);
    
    // Select the first candidate in hierarchy order that successfully found images
    for (const candidate of candidates) {
      const match = results.find(r => r.candidate === candidate);
      if (match && match.urls.length > 0) {
        return match.urls;
      }
    }
    
    // Fallback if no candidates found matches
    return [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ];
  } catch (error) {
    console.error("Error in getDestinationPhotos:", error);
    return [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ];
  }
}

export async function getDestinationPhotosBatch(
  items: { key: string; query: string; destination: string }[]
): Promise<Record<string, string>> {
  try {
    const promises = items.map(async (item) => {
      const urls = await getDestinationPhotos(item.query, 1, item.destination);
      return { key: item.key, url: urls[0] || "" };
    });
    
    const results = await Promise.all(promises);
    
    const mapping: Record<string, string> = {};
    for (const res of results) {
      if (res.url) {
        mapping[res.key] = res.url;
      }
    }
    return mapping;
  } catch (error) {
    console.error("Error in getDestinationPhotosBatch:", error);
    return {};
  }
}
