import { Vehicle } from './Vehicle.ts';

export class Tram extends Vehicle {
    getType() { return "Tramvay"; }
    getCapacity() { return 150; }
    getPowerUsage() { return 120; }
}
