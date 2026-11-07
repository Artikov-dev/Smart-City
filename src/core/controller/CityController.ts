import type { ILight } from '../interfaces/ILight.ts';
import type { ISubsystem } from '../interfaces/ISubsystem.ts';
import type { IVehicle } from '../interfaces/IVehicle.ts';
import type { IWeatherProvider, WeatherInfo } from '../interfaces/IWeatherProvider.ts';
import type { District } from '../../models/District.ts';
import { LightingSystem } from '../../modules/lighting/LightingSystem.ts';
import { TransportSystem } from '../../modules/transport/TransportSystem.ts';
import { SecuritySystem } from '../../modules/security/SecuritySystem.ts';
import { EnergySystem, type EnergyReport } from '../../modules/energy/EnergySystem.ts';
import { SecurityProxy } from '../proxy/SecurityProxy.ts';
import { WeatherAdapter } from '../adapters/WeatherAdapter.ts';
import { ExternalWeatherService } from '../adapters/external/ExternalWeatherService.ts';
import { createVehicleFactory } from '../factories/VehicleFactory.ts';
import { upgradeLight as decorateLight } from '../decorators/SmartLightDecorator.ts';
import { Logger } from '../../utils/Logger.ts';

export const DEFAULT_SECURITY_PASSWORD = "admin123";
export const BASE_ENERGY_LIMIT = 50;

export interface WeatherUpdate {
    weather: WeatherInfo;
    lighting: string;
    transport: string;
}

export class CityController {
    private static instance: CityController | null = null;

    private lighting = new LightingSystem();
    private transport = new TransportSystem();
    private security = new SecuritySystem();
    private securityProxy = new SecurityProxy(this.security, DEFAULT_SECURITY_PASSWORD);
    private energy = new EnergySystem(BASE_ENERGY_LIMIT);
    private weather: IWeatherProvider = new WeatherAdapter(new ExternalWeatherService());
    private districts: District[] = [];
    private lastWeather: WeatherInfo | null = null;
    private nightMode = false;
    private logger = Logger.getInstance();

    private constructor() {
        this.energy.addConsumer(this.lighting);
        this.energy.addConsumer(this.transport);
        this.energy.addConsumer(this.security);
    }

    static getInstance(): CityController {
        if (!CityController.instance) CityController.instance = new CityController();
        return CityController.instance;
    }

    static resetInstance() { CityController.instance = null; }

    getSecurity() { return this.securityProxy; }
    setWeatherProvider(provider: IWeatherProvider) { this.weather = provider; }
    getWeatherCities() { return this.weather.getSupportedCities(); }
    getLastWeather() { return this.lastWeather; }
    isNightMode() { return this.nightMode; }

    hasDistrict(name: string) {
        return this.districts.some(d => d.getName().toLowerCase() === name.trim().toLowerCase());
    }

    addDistrict(district: District) {
        if (this.hasDistrict(district.getName())) throw new Error(`"${district.getName()}" tumani allaqachon mavjud`);
        this.districts.push(district);
        district.getLights().forEach(light => {
            if (this.nightMode) light.turnOn();
            light.setBrightness(this.currentBrightness());
            this.lighting.addLight(light);
        });
        district.getVehicles().forEach(v => this.transport.addVehicle(v));
        district.getCameras().forEach(c => this.security.addCamera(c));
        this.energy.increaseLimit(district.getEnergyLimit());
        this.logger.info(`Tuman qo'shildi: ${district.describe()}`);
        this.checkEnergy();
    }

    getDistricts() { return [...this.districts]; }
    getTotalPopulation() { return this.districts.reduce((sum, d) => sum + d.getPopulation(), 0); }

    dispatchVehicle(type: string, route: string): IVehicle {
        const vehicle = this.transport.dispatch(createVehicleFactory(type), route.trim() || "Umumiy yo'nalish");
        this.checkEnergy();
        return vehicle;
    }

    removeVehicle(id: string) {
        const removed = this.transport.removeVehicle(id);
        if (removed) this.logger.info(`Transport olib tashlandi: ${id}`);
        return removed;
    }

    getVehicles() { return this.transport.getVehicles(); }
    getSpeedLimit() { return this.transport.getSpeedLimit(); }
    getLights() { return this.lighting.getLights(); }

    turnLightsOn() {
        this.lighting.turnAllOn();
        this.logger.info("Barcha chiroqlar yoqildi");
        this.checkEnergy();
    }

    turnLightsOff() {
        this.lighting.turnAllOff();
        this.logger.info("Barcha chiroqlar o'chirildi");
    }

    setBrightness(level: number) {
        if (!(level >= 0 && level <= 100)) throw new Error("Yorqinlik 0 dan 100 gacha bo'lishi kerak");
        this.lighting.setBrightnessAll(level);
        this.logger.info(`Yorqinlik ${level}% ga o'rnatildi`);
    }

    upgradeLight(id: string, kind: string): ILight {
        const light = this.lighting.findLight(id);
        if (!light) throw new Error(`Chiroq topilmadi: ${id}`);
        const upgraded = decorateLight(light, kind);
        this.lighting.replaceLight(light.getId(), upgraded);
        this.logger.info(`Chiroq yangilandi: ${upgraded.describe()}`);
        return upgraded;
    }

    updateWeather(city: string): WeatherUpdate {
        const weather = this.weather.getWeather(city);
        this.lastWeather = weather;
        const lighting = this.lighting.adjustToWeather(weather);
        const transport = this.transport.adjustToWeather(weather);
        this.logger.info(`Ob-havo: ${weather.city}, ${weather.temperature}°C, ${weather.condition}`);
        this.checkEnergy();
        return { weather, lighting, transport };
    }

    activateNightMode() {
        this.nightMode = true;
        this.lighting.turnAllOn();
        this.lighting.setBrightnessAll(this.currentBrightness());
        this.security.arm();
        this.logger.info("Tungi rejim yoqildi");
        this.checkEnergy();
        return [
            `Chiroqlar yoqildi: ${this.lighting.getOnCount()} ta (${this.currentBrightness()}%)`,
            "Xavfsizlik tizimi faollashtirildi",
            `Energiya: ${this.energy.getStatus()}`,
        ];
    }

    activateDayMode() {
        this.nightMode = false;
        this.lighting.turnAllOff();
        this.security.disarm();
        this.logger.info("Kunduzgi rejim yoqildi");
        return [
            "Barcha chiroqlar o'chirildi",
            "Xavfsizlik tizimi kunduzgi rejimga o'tdi",
            `Energiya: ${this.energy.getStatus()}`,
        ];
    }

    setEnergySaving(enabled: boolean) {
        this.energy.setSavingMode(enabled);
        this.lighting.setBrightnessAll(this.currentBrightness());
        this.logger.info(`Energiya tejash rejimi ${enabled ? "yoqildi" : "o'chirildi"}`);
    }

    getEnergyReport(): EnergyReport { return this.energy.getReport(); }

    getSubsystems(): ISubsystem[] {
        return [this.lighting, this.transport, this.securityProxy, this.energy];
    }

    getCityReport() {
        const w = this.lastWeather;
        return [
            `Rejim: ${this.nightMode ? "Tungi" : "Kunduzgi"}`,
            `Tumanlar: ${this.districts.length} ta, aholi: ${this.getTotalPopulation()}`,
            ...this.districts.map(d => `  - ${d.describe()}`),
            `Ob-havo: ${w ? `${w.city}, ${w.temperature}°C, ${w.condition}` : "ma'lumot yo'q"}`,
            ...this.getSubsystems().map(s => `${s.getName()}: ${s.getStatus()}`),
        ].join("\n");
    }

    private currentBrightness() { return this.energy.isSavingMode() ? 50 : 100; }

    private checkEnergy() {
        if (this.energy.isOverLimit()) this.logger.warn(`Energiya limiti oshdi: ${this.energy.getStatus()}`);
    }
}
