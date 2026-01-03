import React, { useEffect, useState } from 'react';
import WeatherBackground from './components/WeatherBackground';
import {
  convertTemperature,
  getHumidityValue,
  getVisibilityValue,
  getWindDirection,
} from './components/Helper';
import {
  HumidityIcon,
  WindIcon,
  VisibilityIcon,
  SunriseIcon,
  SunsetIcon,
} from './components/Icons';

const App = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');
  const [suggestion, setSuggestion] = useState([]);
  const [unit, setUnit] = useState('C');
  const [error, setError] = useState('');

  const API_KEY = 'b7b0935768ac5af6a9adfa6aa5a4b569';

  useEffect(() => {
    if (city.trim().length >= 3 && !weather) {
      const timer = setTimeout(() => fetchSuggestions(city), 500);
      return () => clearTimeout(timer);
    }
    setSuggestion([]);
  }, [city, weather]);

  const fetchSuggestions = async (query) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
      );
      res.ok ? setSuggestion(await res.json()) : setSuggestion([]);
    } catch {
      setSuggestion([]);
    }
  };

  const fetchWeatherData = async (url, name = '') => {
    setError('');
    setWeather(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'City not found');
      }
      const data = await response.json();
      setWeather(data);
      setCity(name || data.name);
      setSuggestion([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter a valid city name!');
      return;
    }

    await fetchWeatherData(
      `https://api.openweathermap.org/data/2.5/weather?q=${city.trim()}&appid=${API_KEY}&units=metric`
    );
  };

  const getWeatherCondition = () =>
    weather && ({
      main: weather.weather[0].main,
      isDay:
        Date.now() / 1000 > weather.sys.sunrise &&
        Date.now() / 1000 < weather.sys.sunset,
    });

  return (
    <div className="min-h-screen">
      <WeatherBackground condition={getWeatherCondition()} />

      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="bg-transparent backdrop-filter backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md text-white w-full border border-white/30 relative z-10">
          <h1 className="text-4xl font-extrabold text-center mb-6">
            Weather App
          </h1>

          {error && (
            <p className="text-red-400 text-center mb-3">{error}</p>
          )}

          {!weather ? (
            <form onSubmit={handleSearch} className="flex flex-col relative">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City or Country (min 3 letters)"
                className="mb-4 p-3 rounded border border-white bg-transparent text-white placeholder-white focus:outline-none focus:border-blue-300 transition duration-300"
              />

              {suggestion.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-transparent shadow-md rounded z-10">
                  {suggestion.map((s) => (
                    <button
                      type="button"
                      key={`${s.lat}-${s.lon}`}
                      onClick={() =>
                        fetchWeatherData(
                          `https://api.openweathermap.org/data/2.5/weather?lat=${s.lat}&lon=${s.lon}&appid=${API_KEY}&units=metric`,
                          `${s.name},${s.country}${
                            s.state ? `,${s.state}` : ''
                          }`
                        )
                      }
                      className="block hover:bg-blue-700 bg-transparent px-4 py-2 text-sm text-left w-full transition-colors"
                    >
                      {s.name}, {s.country}
                      {s.state && `, ${s.state}`}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="bg-purple-700 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Get Weather
              </button>
            </form>
          ) : (
            <div className="mt-6 text-center transition-opacity duration-500">
              <button
                onClick={() => {
                  setWeather(null);
                  setCity('');
                }}
                className="mb-4 bg-purple-900 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition-colors"
              >
                New Search
              </button>

              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">{weather.name}</h2>
                <button
                  onClick={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-1 px-3 rounded transition-colors"
                >
                  °{unit}
                </button>
              </div>

              {/* WEATHER ICON WITH BOUNCE + SHADOW */}
              <div className="relative flex justify-center my-6">
                <div className="absolute top-14 w-14 h-3 bg-black/40 rounded-full blur-md"></div>

                {weather.weather[0].main === 'Clear' ? (
                  <div className="w-16 h-16 rounded-full bg-yellow-400 animate-bounce shadow-[0_0_25px_rgba(255,200,0,0.6)]"></div>
                ) : (
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    className="mx-auto animate-bounce"
                  />
                )}
              </div>

              <p className="text-4xl">
                {convertTemperature(weather.main.temp, unit)} °{unit}
              </p>

              <p className="capitalize">
                {weather.weather[0].description}
              </p>


              {/* STATS */}
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-3 gap-6 text-center">
                  {[
                    [
                      HumidityIcon,
                      'Humidity',
                      `${weather.main.humidity}% (${getHumidityValue(
                        weather.main.humidity
                      )})`,
                    ],
                    [
                      WindIcon,
                      'Wind',
                      `${weather.wind.speed} m/s ${
                        weather.wind.deg
                          ? `(${getWindDirection(weather.wind.deg)})`
                          : ''
                      }`,
                    ],
                    [
                      VisibilityIcon,
                      'Visibility',
                      getVisibilityValue(weather.visibility),
                    ],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="flex flex-col items-center">
                      <Icon />
                      <p className="mt-2 font-semibold">{label}</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-16 text-center">
                  {[
                    ['Sunrise', SunriseIcon, weather.sys.sunrise],
                    ['Sunset', SunsetIcon, weather.sys.sunset],
                  ].map(([label, Icon, time]) => (
                    <div key={label} className="flex flex-col items-center">
                      <Icon />
                      <p className="mt-2 font-semibold">{label}</p>
                      <p className="text-sm">
                        {new Date(time * 1000).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-sm">
                <p>
                  <strong>Feels Like:</strong>{' '}
                  {convertTemperature(weather.main.feels_like, unit)} °{unit}
                </p>
                <p>
                  <strong>Pressure:</strong> {weather.main.pressure} hPa
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
