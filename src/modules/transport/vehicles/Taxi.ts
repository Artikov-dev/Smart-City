import { Vehicle } from './Vehicle.ts';

export class Taxi extends Vehicle {
    getType() { return "Taksi"; }
    getCapacity() { return 4; }
    getPowerUsage() { return 15; }
}
