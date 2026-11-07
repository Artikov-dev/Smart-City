export interface ILight {
    getId(): string;
    getLocation(): string;
    isOn(): boolean;
    turnOn(): void;
    turnOff(): void;
    getBrightness(): number;
    setBrightness(level: number): void;
    getPowerUsage(): number;
    getFeatures(): string[];
    describe(): string;
}
