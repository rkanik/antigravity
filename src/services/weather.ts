import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from "lucide-react";

export interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
        windSpeed: number;
    };
    daily: {
        time: string[];
        weatherCode: number[];
        temperatureMax: number[];
        temperatureMin: number[];
    };
}

export interface CitySearchResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
}

export async function searchCity(query: string): Promise<CitySearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error searching city:", error);
        return [];
    }
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await response.json();

        return {
            current: {
                temperature: data.current.temperature_2m,
                weatherCode: data.current.weather_code,
                windSpeed: data.current.wind_speed_10m,
            },
            daily: {
                time: data.daily.time,
                weatherCode: data.daily.weather_code,
                temperatureMax: data.daily.temperature_2m_max,
                temperatureMin: data.daily.temperature_2m_min,
            },
        };
    } catch (error) {
        console.error("Error fetching weather:", error);
        return null;
    }
}

export async function getCityName(lat: number, lon: number): Promise<string | null> {
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        const data = await response.json();
        return data.city || data.locality || data.principalSubdivision || "Unknown Location";
    } catch (error) {
        console.error("Error reverse geocoding:", error);
        return null;
    }
}

export function getWeatherIcon(code: number) {
    // WMO Weather interpretation codes (WW)
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog and depositing rime fog
    // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
    // 56, 57: Freezing Drizzle: Light and dense intensity
    // 61, 63, 65: Rain: Slight, moderate and heavy intensity
    // 66, 67: Freezing Rain: Light and heavy intensity
    // 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
    // 77: Snow grains
    // 80, 81, 82: Rain showers: Slight, moderate, and violent
    // 85, 86: Snow showers slight and heavy
    // 95: Thunderstorm: Slight or moderate
    // 96, 99: Thunderstorm with slight and heavy hail

    if (code === 0) return Sun;
    if (code >= 1 && code <= 3) return Cloud;
    if (code >= 45 && code <= 48) return CloudFog;
    if (code >= 51 && code <= 57) return CloudDrizzle;
    if (code >= 61 && code <= 67) return CloudRain;
    if (code >= 71 && code <= 77) return CloudSnow;
    if (code >= 80 && code <= 82) return CloudRain;
    if (code >= 85 && code <= 86) return CloudSnow;
    if (code >= 95) return CloudLightning;

    return Sun;
}

export function getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    };

    return codes[code] || "Unknown";
}
