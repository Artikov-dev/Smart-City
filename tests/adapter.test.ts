import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { WeatherAdapter } from '../src/core/adapters/WeatherAdapter.ts';
import { ExternalWeatherService } from '../src/core/adapters/external/ExternalWeatherService.ts';
import { LightingSystem } from '../src/modules/lighting/LightingSystem.ts';
import { StreetLight } from '../src/modules/lighting/StreetLight.ts';
import type { IWeatherProvider } from '../src/core/interfaces/IWeatherProvider.ts';

describe("Adapter: WeatherAdapter", () => {
    const adapter: IWeatherProvider = new WeatherAdapter(new ExternalWeatherService());

    test("tashqi xizmat mos kelmaydigan formatda (JSON, Farengeyt) javob beradi", () => {
        const raw = JSON.parse(new ExternalWeatherService().fetchRawData("TAS"));
        assert.equal(raw.temp_f, 86);
        assert.equal(raw.sky_code, "CLR");
    });

    test("Farengeytni Selsiyga o'giradi", () => {
        assert.equal(adapter.getWeather("Toshkent").temperature, 30);
        assert.equal(adapter.getWeather("Farg'ona").temperature, -5);
    });

    test("osmon kodini tushunarli holatga o'giradi", () => {
        assert.equal(adapter.getWeather("Toshkent").condition, "Ochiq");
        assert.equal(adapter.getWeather("Samarqand").condition, "Yomg'ir");
        assert.equal(adapter.getWeather("Nukus").condition, "Tuman");
    });
    test("qo'llab-quvvatlanadigan shaharlar ro'yxatini beradi", () => {
        const cities = adapter.getSupportedCities();
        assert.ok(cities.includes("Toshkent"));
        assert.ok(cities.includes("Samarqand"));
        assert.ok(cities.includes("Nukus"));
        assert.ok(cities.includes("Farg'ona"));
        assert.ok(cities.includes("Buxoro"));
    });
    test("ko'rinish va yog'ingarchilikni aniqlaydi", () => {
        assert.equal(adapter.getWeather("Nukus").poorVisibility, true);
        assert.equal(adapter.getWeather("Toshkent").poorVisibility, false);
        assert.equal(adapter.getWeather("Samarqand").precipitation, true);
        assert.equal(adapter.getWeather("Buxoro").precipitation, false);
    });

    test("shahar nomi katta-kichik harfga bog'liq emas", () => {
        assert.equal(adapter.getWeather("  toshkent ").city, "Toshkent");
    });

    test("noma'lum shahar uchun xato beradi", () => {
        assert.throws(() => adapter.getWeather("Parij"), /qo'llab-quvvatlanmaydi/);
    });

    test("faqat xizmatda mavjud stansiyalar ro'yxatga kiradi", () => {
        const limited = new WeatherAdapter(new ExternalWeatherService([
            { station: "TAS", temp_f: 50, sky_code: "CLD", visibility_m: 5000 },
        ]));
        assert.deepEqual(limited.getSupportedCities(), ["Toshkent"]);
        assert.equal(limited.getWeather("Toshkent").temperature, 10);
        assert.throws(() => limited.getWeather("Nukus"), /topilmadi/);
    });

    test("moslashtirilgan ma'lumot tizim ichida ishlatiladi", () => {
        const lighting = new LightingSystem();
        lighting.addLight(new StreetLight("L1", "K"));
        lighting.adjustToWeather(adapter.getWeather("Nukus"));
        assert.equal(lighting.getOnCount(), 1);
    });
});
