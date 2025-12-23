const API_KEY = "94bc46e1931c4dc1607e644d81c211a1";
// Handles weather search, API calls, and UI updates
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const recentCities = document.getElementById("recentCities");

const errorMsg = document.getElementById("errorMsg");
const alertMsg = document.getElementById("alertMsg");

const currentWeather = document.getElementById("currentWeather");
const cityNameEl = document.getElementById("cityName");
const dateEl = document.getElementById("date");
const tempEl = document.getElementById("temp");
const detailsEl = document.getElementById("details");
const iconEl = document.getElementById("icon");
const toggleUnitBtn = document.getElementById("toggleUnit");

const forecastDiv = document.getElementById("forecast");
const body = document.getElementById("body");

let isCelsius = true;
let currentTempC = 0;

/* ---------------- SEARCH CITY ---------------- */
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a valid city name");
    return;
  }
  fetchWeather(city);
});

/* ---------------- CURRENT LOCATION ---------------- */
locationBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    pos => {
      fetchByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => showError("Location permission denied")
  );
});

/* ---------------- FETCH BY CITY ---------------- */
async function fetchWeather(city) {
  try {
    clearUI();
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error("City not found");

    const data = await res.json();
    saveCity(city);
    showCurrentWeather(data);
    fetchForecast(data.coord.lat, data.coord.lon);
  } catch (err) {
    showError(err.message);
  }
}

/* ---------------- FETCH BY COORDS ---------------- */
async function fetchByCoords(lat, lon) {
  try {
    clearUI();
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const data = await res.json();
    showCurrentWeather(data);
    fetchForecast(lat, lon);
  } catch {
    showError("Unable to fetch location weather");
  }
}

/* ---------------- CURRENT WEATHER UI ---------------- */
function showCurrentWeather(data) {
  currentWeather.classList.remove("hidden");

  cityNameEl.innerText = data.name;
  dateEl.innerText = new Date().toDateString();

  currentTempC = data.main.temp;
  tempEl.innerText = `${Math.round(currentTempC)}°C`;

  detailsEl.innerText =
    `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`;

  iconEl.src =
    `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  // Extreme temperature alert
  if (currentTempC > 40) {
    alertMsg.innerText = "⚠️ Extreme Heat Alert!";
    alertMsg.classList.remove("hidden");
  }

  // Dynamic background
  setBackground(data.weather[0].main);
}

/* ---------------- TOGGLE °C / °F ---------------- */
toggleUnitBtn.addEventListener("click", () => {
  if (isCelsius) {
    tempEl.innerText = `${Math.round(currentTempC * 9/5 + 32)}°F`;
  } else {
    tempEl.innerText = `${Math.round(currentTempC)}°C`;
  }
  isCelsius = !isCelsius;
});

/* ---------------- FORECAST ---------------- */
async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  const data = await res.json();

  forecastDiv.innerHTML = "";

  const days = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "bg-blue-100 rounded p-4 text-center";

    card.innerHTML = `
      <p class="font-semibold">${new Date(day.dt_txt).toDateString()}</p>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="mx-auto"/>
      <p>🌡️ ${Math.round(day.main.temp)}°C</p>
      <p>💨 ${day.wind.speed} m/s</p>
      <p>💧 ${day.main.humidity}%</p>
    `;

    forecastDiv.appendChild(card);
  });
}

/* ---------------- RECENT CITIES ---------------- */
function saveCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.includes(city)) cities.push(city);
  localStorage.setItem("cities", JSON.stringify(cities));
  loadCities();
}

function loadCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.length) return;

  recentCities.innerHTML = "<option>Select recent city</option>";
  recentCities.classList.remove("hidden");

  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.innerText = city;
    recentCities.appendChild(option);
  });
}

recentCities.addEventListener("change", e => {
  if (e.target.value !== "Select recent city") {
    fetchWeather(e.target.value);
  }
});

/* ---------------- UTILITIES ---------------- */
function showError(msg) {
  errorMsg.innerText = msg;
  errorMsg.classList.remove("hidden");
}

function clearUI() {
  errorMsg.classList.add("hidden");
  alertMsg.classList.add("hidden");
}

function setBackground(condition) {
  body.className = "min-h-screen flex items-center justify-center";
  if (condition.includes("Rain")) body.classList.add("bg-gray-700");
  else if (condition.includes("Cloud")) body.classList.add("bg-gray-400");
  else body.classList.add("bg-blue-500");
}

loadCities();