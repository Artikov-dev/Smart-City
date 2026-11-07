import type { ISubsystem } from '../../core/interfaces/ISubsystem.ts';
import type { ILight } from '../../core/interfaces/ILight.ts';
import type { WeatherInfo } from '../../core/interfaces/IWeatherProvider.ts';

export class LightingSystem implements ISubsystem {
    private lights: ILight[] = [];

    getName() { return "Yoritish"; }

    addLight(light: ILight) { this.lights.push(light); }
    getLights() { return [...this.lights]; }

    findLight(id: string) {
        return this.lights.find(l => l.getId().toLowerCase() === id.trim().toLowerCase());
    }

    replaceLight(id: string, light: ILight) {
        const index = this.lights.findIndex(l => l.getId() === id);
        if (index === -1) return false;
        this.lights[index] = light;
        return true;
    }

    turnAllOn() { this.lights.forEach(l => l.turnOn()); }
    turnAllOff() { this.lights.forEach(l => l.turnOff()); }
    setBrightnessAll(level: number) { this.lights.forEach(l => l.setBrightness(level)); }
    getOnCount() { return this.lights.filter(l => l.isOn()).length; }

    adjustToWeather(weather: WeatherInfo) {
        if (weather.poorVisibility) {
            this.turnAllOn();
            this.setBrightnessAll(100);
            return "Ko'rinish yomon: barcha chiroqlar 100% yoqildi";
        }
        if (weather.precipitation) {
            this.turnAllOn();
            this.setBrightnessAll(80);
            return "Yog'ingarchilik: barcha chiroqlar 80% yoqildi";
        }
        return "Ob-havo yaxshi: yoritish o'zgarmadi";
    }

    getPowerUsage() { return this.lights.reduce((sum, l) => sum + l.getPowerUsage(), 0) / 1000; }

    getStatus() {
        return `${this.lights.length} ta chiroq, ${this.getOnCount()} tasi yoniq, ${this.getPowerUsage().toFixed(2)} kW`;
    }
}
