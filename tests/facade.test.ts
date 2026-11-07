import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CityController, BASE_ENERGY_LIMIT, DEFAULT_SECURITY_PASSWORD } from '../src/core/controller/CityController.ts';
import { DistrictBuilder } from '../src/core/builders/DistrictBuilder.ts';
import { createDistrictFactory } from '../src/core/factories/DistrictFactory.ts';
import { VehicleFactory } from '../src/core/factories/VehicleFactory.ts';
import type { IWeatherProvider, WeatherInfo } from '../src/core/interfaces/IWeatherProvider.ts';

class FakeWeather implements IWeatherProvider {
    private info: WeatherInfo;
    constructor(info: WeatherInfo) { this.info = info; }
    getWeather() { return this.info; }
    getSupportedCities() { return [this.info.city]; }
}

function makeDistrict(name = "Chilonzor", type = "residential") {
    return new DistrictBuilder()
        .setName(name)
        .setFactory(createDistrictFactory(type))
        .setPopulation(1000)
        .addLights(4, "Ko'cha")
        .addVehicles(2, "Yo'nalish")
        .addCameras("A", "B")
        .setEnergyLimit(500)
        .build();
}

describe("Facade: CityController", () => {
    let city: CityController;

    beforeEach(() => {
        CityController.resetInstance();
        VehicleFactory.resetCounters();
        city = CityController.getInstance();
    });

    test("addDistrict() tuman qismlarini barcha subsistemalarga ulaydi", () => {
        city.addDistrict(makeDistrict());
        assert.equal(city.getLights().length, 4);
        assert.equal(city.getVehicles().length, 2);
        assert.equal(city.getEnergyReport().limit, BASE_ENERGY_LIMIT + 500);
        city.getSecurity().login(DEFAULT_SECURITY_PASSWORD);
        assert.deepEqual(city.getSecurity().getCameras(), ["A", "B"]);
    });

    test("bir xil nomli tumanni ikki marta qo'shib bo'lmaydi", () => {
        city.addDistrict(makeDistrict("Olmazor"));
        assert.throws(() => city.addDistrict(makeDistrict("olmazor")), /allaqachon mavjud/);
    });

    test("tungi rejim chiroqlarni yoqadi va xavfsizlikni faollashtiradi", () => {
        city.addDistrict(makeDistrict());
        city.activateNightMode();
        assert.ok(city.getLights().every(l => l.isOn() && l.getBrightness() === 100));
        assert.equal(city.getSecurity().isArmed(), true);
        assert.equal(city.isNightMode(), true);
    });

    test("kunduzgi rejim chiroqlarni o'chiradi va xavfsizlikni o'chiradi", () => {
        city.addDistrict(makeDistrict());
        city.activateNightMode();
        city.activateDayMode();
        assert.ok(city.getLights().every(l => !l.isOn()));
        assert.equal(city.getSecurity().isArmed(), false);
    });

    test("tejash rejimi yorqinlikni 50% ga tushiradi va tungi rejimda ham saqlanadi", () => {
        city.addDistrict(makeDistrict());
        city.setEnergySaving(true);
        city.activateNightMode();
        assert.ok(city.getLights().every(l => l.getBrightness() === 50));
        assert.equal(city.getEnergyReport().savingMode, true);
    });

    test("tejash rejimi energiya sarfini kamaytiradi", () => {
        city.addDistrict(makeDistrict());
        city.turnLightsOn();
        const before = city.getEnergyReport().consumers[0].usage;
        city.setEnergySaving(true);
        assert.ok(city.getEnergyReport().consumers[0].usage < before);
    });

    test("dispatchVehicle() va removeVehicle() transportni boshqaradi", () => {
        const vehicle = city.dispatchVehicle("tram", "Markaz");
        assert.equal(vehicle.getId(), "TRAM-1");
        assert.equal(city.getVehicles().length, 1);
        assert.equal(city.removeVehicle("tram-1"), true);
        assert.equal(city.removeVehicle("TRAM-1"), false);
        assert.throws(() => city.dispatchVehicle("raketa", "Oy"), /Noma'lum transport/);
    });

    test("updateWeather() yoritish va transportni birga sozlaydi", () => {
        city.addDistrict(makeDistrict());
        city.setWeatherProvider(new FakeWeather({
            city: "Nukus", temperature: 5, condition: "Tuman", poorVisibility: true, precipitation: false,
        }));
        const result = city.updateWeather("Nukus");
        assert.equal(result.weather.city, "Nukus");
        assert.ok(city.getLights().every(l => l.isOn()));
        assert.equal(city.getSpeedLimit(), 30);
        assert.equal(city.getLastWeather()?.condition, "Tuman");
    });

    test("upgradeLight() chiroqni bezaydi va takroriy yangilashni rad etadi", () => {
        city.addDistrict(makeDistrict("Sergeli", "industrial"));
        const upgraded = city.upgradeLight("ser-l1", "motion");
        assert.ok(upgraded.getFeatures().includes("harakat sensori"));
        assert.equal(city.getLights()[0], upgraded);
        assert.throws(() => city.upgradeLight("SER-L1", "motion"), /allaqachon bor/);
        assert.throws(() => city.upgradeLight("YOQ-L9", "eco"), /topilmadi/);
    });

    test("getCityReport() barcha subsistemalar holatini birlashtiradi", () => {
        city.addDistrict(makeDistrict("Yunusobod", "business"));
        const report = city.getCityReport();
        ["Yunusobod", "Yoritish", "Transport", "Xavfsizlik", "Energiya"].forEach(part => {
            assert.ok(report.includes(part), `hisobotda "${part}" yo'q`);
        });
    });

    test("setBrightness() noto'g'ri qiymatni rad etadi", () => {
        assert.throws(() => city.setBrightness(150), /0 dan 100 gacha/);
    });
});
