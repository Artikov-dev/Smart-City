import type { ILight } from '../../core/interfaces/ILight.ts';

export class StreetLight implements ILight {
    private id: string;
    private location: string;
    private maxPower: number;
    private on = false;
    private brightness = 100;

    constructor(id: string, location: string, maxPower = 150) {
        this.id = id;
        this.location = location;
        this.maxPower = maxPower;
    }

    getId() { return this.id; }
    getLocation() { return this.location; }
    isOn() { return this.on; }
    turnOn() { this.on = true; }
    turnOff() { this.on = false; }
    getBrightness() { return this.brightness; }
    setBrightness(level: number) { this.brightness = Math.max(0, Math.min(100, Math.round(level))); }
    getPowerUsage() { return this.on ? (this.maxPower * this.brightness) / 100 : 0; }
    getFeatures(): string[] { return []; }

    describe() {
        return `${this.id} (${this.location}) | ${this.on ? "yoniq" : "o'chiq"} | ${this.brightness}%`;
    }
}
