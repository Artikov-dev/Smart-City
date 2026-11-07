import { Vehicle } from './Vehicle.ts';

export class Bus extends Vehicle {
    getType() { return "Avtobus"; }
    getCapacity() { return 80; }
    getPowerUsage() { return 60; }
}
