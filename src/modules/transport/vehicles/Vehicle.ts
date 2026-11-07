import type { IVehicle } from '../../../core/interfaces/IVehicle.ts';

export abstract class Vehicle implements IVehicle {
    private id: string;
    private route: string;

    constructor(id: string, route: string) {
        this.id = id;
        this.route = route;
    }

    abstract getType(): string;
    abstract getCapacity(): number;
    abstract getPowerUsage(): number;

    getId() { return this.id; }
    getRoute() { return this.route; }
    setRoute(route: string) { this.route = route; }

    describe() {
        return `${this.getType()} ${this.id} | ${this.route} | ${this.getCapacity()} o'rin | ${this.getPowerUsage()} kW`;
    }
}
