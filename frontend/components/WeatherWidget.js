'use client';
import { useEffect, useState } from 'react';
import { Wind, Droplets, Thermometer, Sun, CloudRain, Cloud, Snowflake, Zap, Eye } from 'lucide-react';

const WMO_CODE = {
  0: { label: 'Clear sky', emoji: '☀️' },
  1: { label: 'Mainly clear', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Foggy', emoji: '🌫️' },
  48: { label: 'Icy fog', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌧️' },
  61: { label: 'Light rain', emoji: '🌦️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '❄️' },
  75: { label: 'Heavy snow', emoji: '❄️' },
  80: { label: 'Rain showers', emoji: '🌦️' },
  81: { label: 'Rain showers', emoji: '🌧️' },
  82: { label: 'Violent showers', emoji: '🌧️' },
  85: { label: 'Snow showers', emoji: '🌨️' },
  86: { label: 'Heavy snow showers', emoji: '❄️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm w/ hail', emoji: '⛈️' },
  99: { label: 'Thunderstorm w/ hail', emoji: '⛈️' },
};

function getWeatherInfo(code) {
  return WMO_CODE[code] || { label: 'Unknown', emoji: '🌤️' };
}

function packingTip(codes) {
  const hasRain = codes.some(c => [51,53,55,61,63,65,80,81,82].includes(c));
  const hasSnow = codes.some(c => [71,73,75,85,86].includes(c));
  const hasStorm = codes.some(c => [95,96,99].includes(c));
  const allClear = codes.every(c => c <= 3);
  if (hasStorm) return { tip: 'Expect storms — pack a waterproof jacket and avoid outdoor plans on bad days.', color: 'text-red-400' };
  if (hasSnow) return { tip: 'Snow expected — bring warm layers, waterproof boots, and gloves.', color: 'text-sky-300' };
  if (hasRain) return { tip: 'Rain likely — pack a compact umbrella or rain jacket.', color: 'text-blue-400' };
  if (allClear) return { tip: 'Great weather ahead — pack sunscreen and light breathable clothes.', color: 'text-yellow-400' };
  return { tip: 'Mixed weather — pack layers to adapt to changing conditions.', color: 'text-slate-300' };
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherWidget({ destination, days = 7 }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!destination) return;
    setLoading(true);
    setError(false);

    const city = destination.split(',')[0].trim();
    const forecastDays = Math.min(Math.max(days, 3), 16);

    // Step 1: Geocode city name → lat/lng via Open-Meteo geocoding (free, no key)
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)
      .then(r => r.json())
      .then(geo => {
        const place = geo.results?.[0];
        if (!place) throw new Error('City not found');
        const { latitude, longitude, timezone } = place;

        // Step 2: Fetch forecast
        return fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&current_weather=true&timezone=${encodeURIComponent(timezone || 'auto')}&forecast_days=${forecastDays}`
        ).then(r => r.json());
      })
      .then(data => { setWeather(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [destination, days]);

  if (loading) {
    return (
      <div className="bg-[#1e293b] border border-white/8 rounded-2xl p-5 mb-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-32 mb-3" />
        <div className="h-10 bg-white/10 rounded w-24 mb-2" />
        <div className="h-3 bg-white/10 rounded w-40" />
      </div>
    );
  }

  if (error || !weather?.daily) return null;

  const current = weather.current_weather;
  const daily = weather.daily;
  const forecastCount = Math.min(daily.time.length, days);
  const weatherCodes = daily.weathercode.slice(0, forecastCount);
  const { tip, color } = packingTip(weatherCodes);

  const currentInfo = getWeatherInfo(current?.weathercode);

  return (
    <div className="bg-[#1e293b] border border-sky-500/20 rounded-2xl overflow-hidden mb-6">

      {/* Header — current weather */}
      <div className="bg-linear-to-r from-sky-600 to-blue-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sky-200 text-xs font-semibold uppercase tracking-wide mb-1">
              Weather · {destination.split(',')[0]}
            </p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold leading-none text-white">
                {Math.round(current?.temperature)}°C
              </span>
              <span className="text-3xl mb-1">{currentInfo.emoji}</span>
            </div>
            <p className="text-sky-100 text-sm mt-1">{currentInfo.label}</p>
          </div>
          <div className="text-right space-y-1.5 mt-1">
            <div className="flex items-center justify-end gap-1.5 text-xs text-sky-100">
              <Wind className="w-3.5 h-3.5" /> {Math.round(current?.windspeed)} km/h
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-sky-100">
              <Sun className="w-3.5 h-3.5" /> UV {daily.uv_index_max?.[0] ?? '—'}
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-sky-100">
              <CloudRain className="w-3.5 h-3.5" /> {daily.precipitation_sum?.[0] ?? 0} mm today
            </div>
          </div>
        </div>
      </div>

      {/* Trip forecast per day */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-white/35 uppercase tracking-wide mb-3">
          {forecastCount}-Day Trip Forecast
        </p>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(forecastCount, 7)}, 1fr)` }}>
          {daily.time.slice(0, Math.min(forecastCount, 7)).map((dateStr, i) => {
            const date = new Date(dateStr);
            const dayName = i === 0 ? 'Today' : SHORT_DAYS[date.getDay()];
            const info = getWeatherInfo(daily.weathercode[i]);
            const max = Math.round(daily.temperature_2m_max[i]);
            const min = Math.round(daily.temperature_2m_min[i]);
            const rain = daily.precipitation_sum[i];
            return (
              <div key={dateStr} className="flex flex-col items-center bg-white/4 rounded-xl px-1.5 py-2.5 text-center">
                <p className="text-xs text-white/40 mb-1 font-medium">{dayName}</p>
                <p className="text-xl mb-1">{info.emoji}</p>
                <p className="text-xs font-bold text-white">{max}°</p>
                <p className="text-xs text-white/35">{min}°</p>
                {rain > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <Droplets className="w-2.5 h-2.5 text-sky-400" />
                    <span className="text-[10px] text-sky-400">{rain}mm</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* If trip is longer than 7 days, show remaining days in a compact list */}
        {forecastCount > 7 && (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {daily.time.slice(7, forecastCount).map((dateStr, i) => {
              const date = new Date(dateStr);
              const info = getWeatherInfo(daily.weathercode[7 + i]);
              const max = Math.round(daily.temperature_2m_max[7 + i]);
              const min = Math.round(daily.temperature_2m_min[7 + i]);
              return (
                <div key={dateStr} className="flex items-center gap-2 bg-white/4 rounded-lg px-2.5 py-1.5">
                  <span className="text-sm">{info.emoji}</span>
                  <div>
                    <p className="text-xs text-white/40">{SHORT_DAYS[date.getDay()]} {date.getDate()}</p>
                    <p className="text-xs font-semibold text-white">{max}° <span className="text-white/30 font-normal">{min}°</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Packing tip */}
      <div className="px-4 pb-4 pt-2">
        <div className="bg-white/4 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5">
          <span className="text-base mt-0.5">🎒</span>
          <p className={`text-xs leading-relaxed ${color}`}>{tip}</p>
        </div>
      </div>

    </div>
  );
}
