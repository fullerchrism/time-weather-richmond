// Grab elements from the HTML by their id
const cityTitleEl = document.getElementById("cityTitle");
const citySelectEl = document.getElementById("citySelect");
const unitSelectEl = document.getElementById("unitSelect");
const timeEl = document.getElementById("time");
const weatherEl = document.getElementById("weather");

// These are the "allowed values" we will store in localStorage.
// Using constants helps prevent typos.
const STORAGE_KEYS = {
  city: "tw_city",
  unit: "tw_unit",
};

// A small "database" of cities.
// Each city has:
// - label: what we show in the UI
// - lat/lon: coordinates for the weather API + map marker
// - timeZone: used to render the correct local time
const CITIES = {
     richmond: { label: "Richmond, VA", lat: 37.5407, lon: -77.4360, timeZone: "America/New_York" },
  dc: { label: "Washington, DC", lat: 38.9072, lon: -77.0369, timeZone: "America/New_York" },
  nyc: { label: "New York City", lat: 40.7128, lon: -74.006, timeZone: "America/New_York" },
  london: { label: "London", lat: 51.5072, lon: -0.1276, timeZone: "Europe/London" },
  bristol: { label: "Bristol", lat: 51.4545, lon: -2.5879, timeZone: "Europe/London" },
};

// Helper: turn Open-Meteo weather codes into words
function weatherCodeToText(code) {
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

// Read saved settings (if any) from localStorage.
// localStorage stores ONLY strings, or null if not found.
function loadSettings() {
  const savedCity = localStorage.getItem(STORAGE_KEYS.city);
  const savedUnit = localStorage.getItem(STORAGE_KEYS.unit);

  // Pick defaults if nothing has been saved yet
  const cityKey = savedCity && CITIES[savedCity] ? savedCity : "richmond";
  const unit = savedUnit === "celsius" || savedUnit === "fahrenheit" ? savedUnit : "fahrenheit";

  return { cityKey, unit };
}

// Save settings to localStorage so they persist after refresh/closing the tab
function saveSettings(cityKey, unit) {
  localStorage.setItem(STORAGE_KEYS.city, cityKey);
  localStorage.setItem(STORAGE_KEYS.unit, unit);
}

// Update the title + time based on the chosen city
function updateTime(cityKey) {
  const city = CITIES[cityKey];
  const now = new Date();

  // Intl.DateTimeFormat lets us format time for a specific timezone
  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: city.timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  timeEl.textContent = timeString;
}

// Update weather based on chosen city + unit
async function updateWeather(cityKey, unit) {
  try {
    const city = CITIES[cityKey];

    // Open-Meteo accepts temperature_unit=celsius or fahrenheit
    const tempUnitParam = unit; // already "celsius" or "fahrenheit"

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&temperature_unit=${tempUnitParam}` +
      `&wind_speed_unit=mph` +
      `&timezone=${encodeURIComponent(city.timeZone)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const cur = data.current;

    const temp = Math.round(cur.temperature_2m);
    const wind = Math.round(cur.wind_speed_10m);
    const desc = weatherCodeToText(cur.weather_code);

    const unitSymbol = unit === "celsius" ? "°C" : "°F";
    weatherEl.textContent = `${temp}${unitSymbol} • ${desc} • Wind ${wind} mph`;
  } catch (err) {
    weatherEl.textContent = "Weather unavailable (check console)";
    console.error("Weather error:", err);
  }
}

// Optional: update the embedded OpenStreetMap to match the chosen city
function updateMap(cityKey) {
  const city = CITIES[cityKey];

  // A simple bbox around the city (small-ish zoomed area)
  const lat = city.lat;
  const lon = city.lon;

  const bbox = {
    left: lon - 0.15,
    bottom: lat - 0.10,
    right: lon + 0.15,
    top: lat + 0.10,
  };

  const iframe = document.querySelector("iframe.map");
  const link = document.querySelector("a.map-link");

  if (!iframe || !link) return;

  iframe.src =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${encodeURIComponent(bbox.left)},${encodeURIComponent(bbox.bottom)},${encodeURIComponent(bbox.right)},${encodeURIComponent(bbox.top)}` +
    `&layer=mapnik&marker=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;

  link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
}

// “Render” function: apply current settings to the UI and refresh data
function render(cityKey, unit) {
  const city = CITIES[cityKey];
  cityTitleEl.textContent = city.label;

  updateTime(cityKey);
  updateWeather(cityKey, unit);
  updateMap(cityKey);
}

// ---- App startup ----

// 1) Load settings from localStorage (or defaults)
const settings = loadSettings();

// 2) Set dropdowns to match the loaded settings
citySelectEl.value = settings.cityKey;
unitSelectEl.value = settings.unit;

// 3) Render once immediately
render(settings.cityKey, settings.unit);

// 4) Update time every second (using whatever city is currently selected)
setInterval(() => {
  updateTime(citySelectEl.value);
}, 1000);

// 5) Refresh weather every 10 minutes
setInterval(() => {
  updateWeather(citySelectEl.value, unitSelectEl.value);
}, 10 * 60 * 1000);

// 6) When the user changes city or units, save + re-render
citySelectEl.addEventListener("change", () => {
  const cityKey = citySelectEl.value;
  const unit = unitSelectEl.value;
  saveSettings(cityKey, unit);
  render(cityKey, unit);
});

unitSelectEl.addEventListener("change", () => {
  const cityKey = citySelectEl.value;
  const unit = unitSelectEl.value;
  saveSettings(cityKey, unit);
  render(cityKey, unit);
});
