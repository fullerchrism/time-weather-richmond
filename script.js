const timeEl = document.getElementById("time");
const weatherEl = document.getElementById("weather");

function updateTime() {
  const now = new Date();

  // Richmond is America/New_York
  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  timeEl.textContent = timeString;
}

function weatherCodeToText(code) {
  // Open-Meteo weather codes (simplified)
  const map = {
    0: "Clear",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm (hail)",
    99: "Thunderstorm (heavy hail)",
  };
  return map[code] ?? `Weather code ${code}`;
}

async function updateWeather() {
  try {
    // Richmond, VA (approx)
    const lat = 37.5407;
    const lon = -77.436;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&temperature_unit=fahrenheit` +
      `&wind_speed_unit=mph` +
      `&timezone=America%2FNew_York`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const cur = data.current;

    const temp = Math.round(cur.temperature_2m);
    const wind = Math.round(cur.wind_speed_10m);
    const desc = weatherCodeToText(cur.weather_code);

    weatherEl.textContent = `${temp}°F • ${desc} • Wind ${wind} mph`;
  } catch (err) {
    weatherEl.textContent = "Weather unavailable (check console)";
    console.error("Weather error:", err);
  }
}

updateTime();
setInterval(updateTime, 1000);

updateWeather();
// refresh weather every 10 minutes
setInterval(updateWeather, 10 * 60 * 1000);
