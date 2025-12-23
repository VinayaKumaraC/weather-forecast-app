const API_KEY = "94bc46e1931c4dc1607e644d81c211a1";
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const currentWeather = document.getElementById("currentWeather");
const forecastDiv = document.getElementById("forecast");
const errorMsg = document.getElementById("errorMsg");
const recentCitiesSelect = document.getElementById("recentCities");

let currentTempCelsius = null;
let isCelsius = true;

/* ---------------- EVENTS ---------------- */

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  fetchWeatherByCity(city);
});

locationBtn.addEventListener("click", getLocation);

recentCitiesSelect.addEventListener("change", () => {
  if (recentCitiesSelect.value) {
    fetchWeatherByCity(recentCitiesSelect.value);
  }
});

/* ---------------- ERROR ---------------- */

function showError(message) {
  errorMsg.innerText = message;
  errorMsg.classList.remove("hidden");
}

/* ---------------- FETCH WEATHER ---------------- */

async function fetchWeatherByCity(city) {
  errorMsg.classList.add("hidden");

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error("City not found");

    const data = await res.json();
    displayCurrentWeather(data);
    fetchForecast(data.coord.lat, data.coord.lon);
    saveRecentCity(city);
  } catch (err) {
    showError(err.message);
  }
}

/* ---------------- GEO LOCATION ---------------- */

function getLocation() {
  navigator.geolocation.getCurrentPosition(
    pos => {
      fetchForecast(pos.coords.latitude, pos.coords.longitude);
    },
    () => showError("Location permission denied")
  );
}

/* ---------------- CURRENT WEATHER ---------------- */

function displayCurrentWeather(data) {
  currentWeather.classList.remove("hidden");

  currentTempCelsius = data.main.temp;
  isCelsius = true;

  const condition = data.weather[0].main.toLowerCase();
  const icon = data.weather[0].icon;

  changeBackground(condition, currentTempCelsius);

  currentWeather.innerHTML = `
    <h2 class="text-2xl font-bold">${data.name}</h2>

    <img
      src="https://openweathermap.org/img/wn/${icon}@2x.png"
      class="mx-auto"
      alt="Weather Icon"
    />

    <p class="capitalize">${data.weather[0].description}</p>

    <p id="tempValue" class="text-4xl font-bold mt-2">
      ${currentTempCelsius}°C
    </p>

    <button
      onclick="toggleTemp()"
      class="mt-2 bg-black/30 px-4 py-1 rounded"
    >
      Switch to °F
    </button>

    <div class="mt-3 space-y-1">
      <p>💧 Humidity: ${data.main.humidity}%</p>
      <p>💨 Wind: ${data.wind.speed} m/s</p>
    </div>

    ${currentTempCelsius > 40 ? `
      <p class="mt-3 text-red-300 font-bold">
        ⚠️ Extreme Heat Alert!
      </p>` : ""}
  `;
}

/* ---------------- TEMP TOGGLE ---------------- */

function toggleTemp() {
  const tempEl = document.getElementById("tempValue");
  const btn = event.target;

  if (isCelsius) {
    const fahrenheit = (currentTempCelsius * 9/5 + 32).toFixed(1);
    tempEl.innerText = `${fahrenheit}°F`;
    btn.innerText = "Switch to °C";
  } else {
    tempEl.innerText = `${currentTempCelsius}°C`;
    btn.innerText = "Switch to °F";
  }

  isCelsius = !isCelsius;
}

/* ---------------- FORECAST ---------------- */

async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );

  const data = await res.json();
  displayForecast(data.list);
}

function displayForecast(list) {
  forecastDiv.innerHTML = "";

  for (let i = 0; i < list.length; i += 8) {
    const day = list[i];

    forecastDiv.innerHTML += `
      <div class="bg-white/20 backdrop-blur-md p-4 rounded text-center">
        <p class="font-semibold">
          ${new Date(day.dt_txt).toDateString()}
        </p>

        <img
          src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png"
          class="mx-auto"
        />

        <p class="text-xl">${day.main.temp}°C</p>
        <p>💨 ${day.wind.speed} m/s</p>
        <p>💧 ${day.main.humidity}%</p>
      </div>
    `;
  }
}

/* ---------------- RECENT SEARCHES ---------------- */

function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];

  if (!cities.includes(city)) {
    cities.unshift(city);
    if (cities.length > 5) cities.pop();
    localStorage.setItem("cities", JSON.stringify(cities));
  }

  updateRecentDropdown();
}

function updateRecentDropdown() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (cities.length === 0) return;

  recentCitiesSelect.classList.remove("hidden");
  recentCitiesSelect.innerHTML = `<option value="">Recent Searches</option>`;

  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    recentCitiesSelect.appendChild(option);
  });
}

updateRecentDropdown();

/* ---------------- BACKGROUND ---------------- */

function changeBackground(condition, temp) {
  const body = document.body.classList;

  const rain = document.getElementById("rain");
  const clouds = document.getElementById("clouds");
  const snow = document.getElementById("snow");
  const sunny = document.getElementById("sunny");

  // Hide all animations
  rain.classList.add("hidden");
  clouds.classList.add("hidden");
  snow.classList.add("hidden");
  sunny.classList.add("hidden");

  // Reset background gradient
  body.remove(
    "from-blue-400","to-indigo-600",
    "from-gray-600","to-gray-900",
    "from-yellow-300","to-orange-500",
    "from-cyan-400","to-blue-600",
    "from-red-500","to-orange-700"
  );

  if (condition.includes("rain")) {
    body.add("from-gray-600","to-gray-900");
    rain.classList.remove("hidden");
  }
  else if (condition.includes("snow")) {
    body.add("from-cyan-400","to-blue-600");
    snow.classList.remove("hidden");
  }
  else if (condition.includes("cloud")) {
    body.add("from-cyan-400","to-blue-600");
    clouds.classList.remove("hidden");
  }
  else if (condition.includes("clear")) {
    body.add("from-yellow-300","to-orange-500");
    sunny.classList.remove("hidden");
  }
  else if (temp > 40) {
    body.add("from-red-500","to-orange-700");
  }
  else {
    body.add("from-blue-400","to-indigo-600");
  }
}
