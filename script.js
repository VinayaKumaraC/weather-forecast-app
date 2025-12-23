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

/* EVENTS */
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return showError("Please enter a city name");
  fetchWeatherByCity(city);
});

locationBtn.addEventListener("click", getLocation);

recentCitiesSelect.addEventListener("change", () => {
  if (recentCitiesSelect.value) fetchWeatherByCity(recentCitiesSelect.value);
});

/* ERROR */
function showError(msg) {
  errorMsg.innerText = msg;
  errorMsg.classList.remove("hidden");
}

/* CITY SEARCH */
async function fetchWeatherByCity(city) {
  errorMsg.classList.add("hidden");

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=en&appid=${API_KEY}`
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

/* LOCATION SEARCH (FIXED) */
function getLocation() {
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      cityInput.value = "";

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${API_KEY}`
      );

      const data = await res.json();
      displayCurrentWeather(data);
      fetchForecast(lat, lon);
    },
    () => showError("Location permission denied")
  );
}

/* CURRENT WEATHER */
function displayCurrentWeather(data) {
  currentWeather.classList.remove("hidden");

  currentTempCelsius = data.main.temp;
  isCelsius = true;

  const condition = data.weather[0].main.toLowerCase();
  const icon = data.weather[0].icon;

  changeBackground(condition);

  currentWeather.innerHTML = `
    <h2 class="text-2xl font-bold">📍 ${data.name}, ${data.sys.country} (Current Location)</h2>

    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="mx-auto"/>

    <p class="capitalize">${data.weather[0].description}</p>

    <p id="tempValue" class="text-4xl font-bold mt-2">
      ${currentTempCelsius}°C
    </p>

    <button onclick="toggleTemp()"
      class="mt-2 bg-black/30 px-4 py-1 rounded">
      Switch to °F
    </button>

    <p class="mt-2">💧 Humidity: ${data.main.humidity}%</p>
    <p>💨 Wind: ${data.wind.speed} m/s</p>
  `;
}

/* TEMP TOGGLE */
function toggleTemp() {
  const tempEl = document.getElementById("tempValue");
  const btn = event.target;

  if (isCelsius) {
    tempEl.innerText = `${(currentTempCelsius * 9/5 + 32).toFixed(1)}°F`;
    btn.innerText = "Switch to °C";
  } else {
    tempEl.innerText = `${currentTempCelsius}°C`;
    btn.innerText = "Switch to °F";
  }
  isCelsius = !isCelsius;
}

/* FORECAST */
async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${API_KEY}`
  );
  const data = await res.json();
  displayForecast(data.list);
}

function displayForecast(list) {
  forecastDiv.innerHTML = "";
  for (let i = 0; i < list.length; i += 8) {
    const d = list[i];
    forecastDiv.innerHTML += `
      <div class="bg-white/20 p-4 rounded text-center">
        <p>${new Date(d.dt_txt).toDateString()}</p>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" class="mx-auto"/>
        <p>${d.main.temp}°C</p>
        <p>💨 ${d.wind.speed} m/s</p>
        <p>💧 ${d.main.humidity}%</p>
      </div>`;
  }
}

/* RECENT SEARCHES */
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
  if (!cities.length) return;

  recentCitiesSelect.classList.remove("hidden");
  recentCitiesSelect.innerHTML = `<option value="">Recent Searches</option>`;
  cities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    recentCitiesSelect.appendChild(opt);
  });
}
updateRecentDropdown();

/* BACKGROUND */
function changeBackground(condition) {
  const body = document.body.classList;
  const rain = document.getElementById("rain");
  const clouds = document.getElementById("clouds");
  const snow = document.getElementById("snow");
  const sunny = document.getElementById("sunny");

  [rain, clouds, snow, sunny].forEach(el => el.classList.add("hidden"));

  body.remove(
    "from-gray-600","to-gray-900",
    "from-yellow-300","to-orange-500",
    "from-cyan-400","to-blue-600"
  );
  body.add("from-blue-400","to-indigo-600");

  if (condition.includes("rain")) {
    body.remove("from-blue-400","to-indigo-600");
    body.add("from-gray-600","to-gray-900");
    rain.classList.remove("hidden");
  }
  else if (condition.includes("snow")) {
    body.remove("from-blue-400","to-indigo-600");
    body.add("from-cyan-400","to-blue-600");
    snow.classList.remove("hidden");
  }
  else if (condition.includes("cloud")) {
    body.remove("from-blue-400","to-indigo-600");
    body.add("from-cyan-400","to-blue-600");
    clouds.classList.remove("hidden");
  }
  else if (condition.includes("clear")) {
    body.remove("from-blue-400","to-indigo-600");
    body.add("from-yellow-300","to-orange-500");
    sunny.classList.remove("hidden");
  }
}
