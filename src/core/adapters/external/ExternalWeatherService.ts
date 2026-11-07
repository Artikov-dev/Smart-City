export interface RawWeatherReading {
    station: string;
    temp_f: number;
    sky_code: string;
    visibility_m: number;
}

const DEFAULT_READINGS: RawWeatherReading[] = [
    { station: "TAS", temp_f: 86, sky_code: "CLR", visibility_m: 10000 },
    { station: "SAM", temp_f: 59, sky_code: "RA", visibility_m: 3000 },
    { station: "NUK", temp_f: 41, sky_code: "FG", visibility_m: 400 },
    { station: "FER", temp_f: 23, sky_code: "SN", visibility_m: 1500 },
    { station: "BUX", temp_f: 77, sky_code: "CLD", visibility_m: 8000 },
];

export class ExternalWeatherService {
    private readings = new Map<string, RawWeatherReading>();

    constructor(readings: RawWeatherReading[] = DEFAULT_READINGS) {
        readings.forEach(r => this.readings.set(r.station, { ...r }));
    }

    fetchRawData(stationCode: string): string {
        const reading = this.readings.get(stationCode.toUpperCase());
        if (!reading) throw new Error(`Meteostansiya topilmadi: ${stationCode}`);
        return JSON.stringify(reading);
    }

    listStations() { return [...this.readings.keys()]; }
}
