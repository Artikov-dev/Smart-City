export interface WeatherInfo {
    city: string;
    temperature: number;
    condition: string;
    poorVisibility: boolean;
    precipitation: boolean;
}

export interface IWeatherProvider {
    getWeather(city: string): WeatherInfo;
    getSupportedCities(): string[];
}
