"use server";

export async function getWeatherAction(destination: string, dateStr: string) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.error("WeatherAPI key is missing in environment variables");
    return null;
  }

  const targetDate = new Date(dateStr);
  const diffTime = targetDate.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine endpoint based on whether target date is within current 10-day forecast window
  let url = "";
  let isHistorical = false;

  if (diffDays >= -1 && diffDays <= 10) {
    url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(destination)}&dt=${dateStr}`;
  } else {
    isHistorical = true;
    // Calculate the same calendar date but of last year so history.json succeeds
    const lastYearDate = new Date(targetDate);
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
    const lastYearDateStr = lastYearDate.toISOString().split("T")[0];
    url = `http://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(destination)}&dt=${lastYearDateStr}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (isHistorical) {
        const fallbackUrl = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(destination)}&days=10`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const forecastDay = fallbackData.forecast?.forecastday?.[0]?.day;
          if (forecastDay) {
            return {
              lat: fallbackData.location.lat,
              lon: fallbackData.location.lon,
              temp: Math.round(forecastDay.maxtemp_c),
              condition: forecastDay.condition.text,
              conditionIcon: "https:" + fallbackData.forecast?.forecastday?.[0]?.day?.condition?.icon,
              humidity: Math.round(forecastDay.avghumidity),
              wind: Math.round(forecastDay.maxwind_kph),
              isReal: true,
              isHistorical: false,
            };
          }
        }
      }
      throw new Error(`WeatherAPI responded with status ${res.status}`);
    }

    const data = await res.json();
    const forecastday = data.forecast?.forecastday?.[0];
    const dayData = forecastday?.day;

    if (dayData) {
      let iconUrl = dayData.condition.icon;
      if (iconUrl.startsWith("//")) {
        iconUrl = "https:" + iconUrl;
      }

      return {
        lat: data.location.lat,
        lon: data.location.lon,
        temp: Math.round(dayData.maxtemp_c),
        condition: dayData.condition.text,
        conditionIcon: iconUrl,
        humidity: Math.round(dayData.avghumidity),
        wind: Math.round(dayData.maxwind_kph),
        isReal: true,
        isHistorical,
      };
    }
    return null;
  } catch (error) {
    console.error("WeatherAPI fetch error:", error);
    return null;
  }
}
