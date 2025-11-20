"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Wind, Droplets, Thermometer, CloudSun, Navigation } from "lucide-react";
import { searchCity, getWeather, getWeatherIcon, getWeatherDescription, getCityName, CitySearchResult, WeatherData } from "@/services/weather";

export default function WeatherPage() {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
    const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);

    useEffect(() => {
        handleUseLocation();
    }, []);

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            // Fallback to London if geolocation not supported
            handleSelectCity({
                id: 2643743,
                name: "London",
                latitude: 51.5085,
                longitude: -0.1257,
                country: "United Kingdom",
                admin1: "England"
            });
            return;
        }

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const cityName = await getCityName(latitude, longitude);

                const city: CitySearchResult = {
                    id: 0, // Dynamic ID
                    name: cityName || "My Location",
                    latitude,
                    longitude,
                    country: "",
                };

                await handleSelectCity(city);
                setGeoLoading(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setGeoLoading(false);
                // Fallback to London on error
                handleSelectCity({
                    id: 2643743,
                    name: "London",
                    latitude: 51.5085,
                    longitude: -0.1257,
                    country: "United Kingdom",
                    admin1: "England"
                });
            }
        );
    };

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length >= 2) {
            setSearching(true);
            const results = await searchCity(value);
            setSearchResults(results);
            setSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectCity = async (city: CitySearchResult) => {
        setSelectedCity(city);
        setQuery("");
        setSearchResults([]);
        setLoading(true);

        const data = await getWeather(city.latitude, city.longitude);
        setWeather(data);
        setLoading(false);
    };

    const CurrentWeatherIcon = weather ? getWeatherIcon(weather.current.weatherCode) : null;

    return (
        <div className="min-h-screen bg-neutral-950 pt-20 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Search Section */}
                <div className="relative z-20 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={handleSearch}
                            placeholder="Search for a city..."
                            className="w-full bg-neutral-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        />
                    </div>

                    <button
                        onClick={handleUseLocation}
                        disabled={geoLoading}
                        className="px-4 bg-neutral-900 border border-white/10 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-center text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Use my location"
                    >
                        {geoLoading ? (
                            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        ) : (
                            <Navigation className="w-5 h-5" />
                        )}
                    </button>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                            {searchResults.map((city) => (
                                <button
                                    key={city.id}
                                    onClick={() => handleSelectCity(city)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <div>
                                        <div className="text-white font-medium">{city.name}</div>
                                        <div className="text-sm text-neutral-400">
                                            {[city.admin1, city.country].filter(Boolean).join(", ")}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        <p className="text-neutral-400 animate-pulse">Loading weather data...</p>
                    </div>
                ) : weather && selectedCity ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Current Weather Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-white/10 p-8 sm:p-12">
                            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />

                            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="text-center sm:text-left space-y-2">
                                    <div className="flex items-center justify-center sm:justify-start gap-2 text-cyan-400 mb-4">
                                        <MapPin className="w-5 h-5" />
                                        <span className="font-medium tracking-wide uppercase text-sm">
                                            {selectedCity.name}, {selectedCity.country}
                                        </span>
                                    </div>
                                    <h1 className="text-7xl sm:text-9xl font-bold text-white tracking-tighter">
                                        {Math.round(weather.current.temperature)}°
                                    </h1>
                                    <p className="text-xl sm:text-2xl text-neutral-300 font-medium capitalize">
                                        {getWeatherDescription(weather.current.weatherCode)}
                                    </p>
                                </div>

                                <div className="flex flex-col items-center gap-6">
                                    {CurrentWeatherIcon && (
                                        <CurrentWeatherIcon className="w-32 h-32 sm:w-40 sm:h-40 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
                                    )}
                                    <div className="grid grid-cols-2 gap-4 w-full max-w-[200px]">
                                        <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm border border-white/5">
                                            <Wind className="w-5 h-5 text-neutral-400" />
                                            <span className="text-white font-bold">{weather.current.windSpeed}</span>
                                            <span className="text-[10px] text-neutral-500 uppercase">km/h</span>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm border border-white/5">
                                            <Thermometer className="w-5 h-5 text-neutral-400" />
                                            <span className="text-white font-bold">
                                                {Math.round(weather.daily.temperatureMax[0])}°
                                                <span className="text-neutral-500 text-sm font-normal"> / </span>
                                                {Math.round(weather.daily.temperatureMin[0])}°
                                            </span>
                                            <span className="text-[10px] text-neutral-500 uppercase">H / L</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Forecast Grid */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-cyan-500 rounded-full" />
                                7-Day Forecast
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                {weather.daily.time.map((date, index) => {
                                    const ForecastIcon = getWeatherIcon(weather.daily.weatherCode[index]);
                                    const isToday = index === 0;

                                    return (
                                        <div
                                            key={date}
                                            className={`
                                                relative overflow-hidden rounded-2xl p-4 flex flex-col items-center gap-3 border transition-all duration-300 group
                                                ${isToday
                                                    ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                                                    : "bg-neutral-900/50 border-white/5 hover:bg-white/5 hover:border-white/10"
                                                }
                                            `}
                                        >
                                            <span className={`text-sm font-medium ${isToday ? "text-cyan-400" : "text-neutral-400"}`}>
                                                {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                                            </span>
                                            <ForecastIcon className={`w-8 h-8 ${isToday ? "text-white" : "text-neutral-300 group-hover:text-white group-hover:scale-110 transition-all"}`} />
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-white font-bold">
                                                    {Math.round(weather.daily.temperatureMax[index])}°
                                                </span>
                                                <span className="text-neutral-500">
                                                    {Math.round(weather.daily.temperatureMin[index])}°
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 mb-4">
                            <CloudSun className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No City Selected</h3>
                        <p className="text-neutral-400">Search for a city to see the forecast</p>
                    </div>
                )}
            </div>
        </div>
    );
}
