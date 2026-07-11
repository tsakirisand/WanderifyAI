"use server";

function getQueryCandidates(query: string, destination: string): string[] {
  const candidates: string[] = [];
  
  // Clean up the query string
  const clean = (str: string) => {
    return str
      .replace(/\b(arrival at|departure from|check-in|check-out|return to|hotel relaxation in|dinner in|lunch & relaxation|visit to|explore|exploration|trip to|day at|farewell dinner at a|farewell dinner at|lunch at|breakfast at|local dinner at|relax at)\b/gi, "")
      .replace(/\(.*?\)/g, "") // Remove parentheses details like airport codes
      .trim();
  };

  const cleanedQuery = clean(query);
  const cleanedDest = clean(destination);

  // 1. Specific combination: query + destination
  if (cleanedQuery && cleanedDest && cleanedQuery !== cleanedDest) {
    candidates.push(`${cleanedQuery} ${cleanedDest}`);
  }

  // 2. The cleaned query itself
  if (cleanedQuery) {
    candidates.push(cleanedQuery);
  }

  // 3. The cleaned destination itself
  if (cleanedDest) {
    candidates.push(cleanedDest);
    // Try first segment if destination contains commas (e.g. "Santorini" from "Santorini, Greece")
    if (cleanedDest.includes(",")) {
      const parts = cleanedDest.split(",").map(p => p.trim());
      if (parts[0]) {
        candidates.push(parts[0]);
      }
    }
  }

  return Array.from(new Set(candidates)).filter(c => c.length > 0);
}

export async function getDestinationPhotos(query: string, count: number = 5, destination: string = ""): Promise<string[]> {
  try {
    const candidates = getQueryCandidates(query, destination);
    
    for (const candidate of candidates) {
      const formattedQuery = encodeURIComponent(candidate);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${formattedQuery}&gsrnamespace=6&gsrlimit=10&piprop=thumbnail&pithumbsize=1200`;
      
      const res = await fetch(url, {
        next: { revalidate: 86400 } // Cache for 24 hours
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      if (data && data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as any[];
        // Sort by index to maintain consistent ordering
        pages.sort((a, b) => (a.index || 0) - (b.index || 0));
        
        const urls = pages.map(p => p.thumbnail?.source).filter(Boolean);
        if (urls.length > 0) {
          // If we only need 1 photo, use a hash of the original query to select consistently
          if (count === 1) {
            let hash = 0;
            for (let i = 0; i < query.length; i++) {
              hash = query.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % urls.length;
            return [urls[index]];
          }
          return urls.slice(0, count);
        }
      }
    }
    
    // Fallback if no images found
    return [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80"
    ];
  } catch (error) {
    console.error("Error in getDestinationPhotos:", error);
    return [
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
