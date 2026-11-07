import type { ILight } from '../interfaces/ILight.ts';

export abstract class SmartLightDecorator implements ILight {
    protected light: ILight;

    constructor(light: ILight) { this.light = light; }

    protected abstract getFeatureName(): string;

    getId() { return this.light.getId(); }
    getLocation() { return this.light.getLocation(); }
    isOn() { return this.light.isOn(); }
    turnOn() { this.light.turnOn(); }
    turnOff() { this.light.turnOff(); }
    getBrightness() { return this.light.getBrightness(); }
    setBrightness(level: number) { this.light.setBrightness(level); }
    getPowerUsage() { return this.light.getPowerUsage(); }
    getFeatures() { return [...this.light.getFeatures(), this.getFeatureName()]; }
    describe() { return `${this.light.describe()} +${this.getFeatureName()}`; }
}

export class MotionSensorLight extends SmartLightDecorator {
    protected getFeatureName() { return "harakat sensori"; }
    getPowerUsage() { return this.light.getPowerUsage() * 0.6; }
}

export class EnergySavingLight extends SmartLightDecorator {
    protected getFeatureName() { return "LED tejamkor"; }
    getPowerUsage() { return this.light.getPowerUsage() * 0.5; }
}

const UPGRADES: Record<string, (light: ILight) => ILight> = {
    motion: light => new MotionSensorLight(light),
    eco: light => new EnergySavingLight(light),
};

export const LIGHT_UPGRADES = Object.keys(UPGRADES);

export function upgradeLight(light: ILight, kind: string): ILight {
    const upgrade = UPGRADES[kind];
    if (!upgrade) throw new Error(`Noma'lum yangilash turi: ${kind}`);
    const upgraded = upgrade(light);
    const feature = upgraded.getFeatures()[upgraded.getFeatures().length - 1];
    if (light.getFeatures().includes(feature)) {
        throw new Error(`${light.getId()} chirog'ida "${feature}" allaqachon bor`);
    }
    return upgraded;
}
