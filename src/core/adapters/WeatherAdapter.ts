import type { IWeatherProvider, WeatherInfo } from '../interfaces/IWeatherProvider.ts';
import type { ExternalWeatherService, RawWeatherReading } from './external/ExternalWeatherService.ts';

const CITY_STATIONS: Record<string, string> = {
    "Toshkent": "TAS",
    "Samarqand": "SAM",
    "Nukus": "NUK",
    "Farg'ona": "FER",
    "Buxoro": "BUX",
};

const SKY_CONDITIONS: Record<string, string> = {
    CLR: "Ochiq",
    CLD: "Bulutli",
    RA: "Yomg'ir",
    SN: "Qor",
    FG: "Tuman",
};

export class WeatherAdapter implements IWeatherProvider {
    private service: ExternalWeatherService;

    constructor(service: ExternalWeatherService) { this.service = service; }

    getWeather(city: string): WeatherInfo {
        const name = this.resolveCity(city);
        const raw = JSON.parse(this.service.fetchRawData(CITY_STATIONS[name])) as RawWeatherReading;
        return {
            city: name,
            temperature: Math.round(((raw.temp_f - 32) * 5) / 9),
            condition: SKY_CONDITIONS[raw.sky_code] ?? "Noma'lum",
            poorVisibility: raw.visibility_m < 1000,
            precipitation: raw.sky_code === "RA" || raw.sky_code === "SN",
        };
    }

    getSupportedCities() {
        const stations = this.service.listStations();
        return Object.keys(CITY_STATIONS).filter(city => stations.includes(CITY_STATIONS[city]));
    }

    private resolveCity(city: string) {
        const name = Object.keys(CITY_STATIONS).find(c => c.toLowerCase() === city.trim().toLowerCase());
        if (!name) throw new Error(`Shahar qo'llab-quvvatlanmaydi: ${city}`);
        return name;
    }
}
