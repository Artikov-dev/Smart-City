import type { IVehicle } from '../interfaces/IVehicle.ts';
import { Bus } from '../../modules/transport/vehicles/Bus.ts';
import { Tram } from '../../modules/transport/vehicles/Tram.ts';
import { Taxi } from '../../modules/transport/vehicles/Taxi.ts';
import { Logger } from '../../utils/Logger.ts';

export abstract class VehicleFactory {
    private static counters = new Map<string, number>();

    static resetCounters() { VehicleFactory.counters.clear(); }

    protected abstract createVehicle(id: string, route: string): IVehicle;
    protected abstract getPrefix(): string;

    deploy(route: string): IVehicle {
        const prefix = this.getPrefix();
        const next = (VehicleFactory.counters.get(prefix) ?? 0) + 1;
        VehicleFactory.counters.set(prefix, next);
        const vehicle = this.createVehicle(`${prefix}-${next}`, route);
        Logger.getInstance().info(`Yangi transport: ${vehicle.describe()}`);
        return vehicle;
    }
}

export class BusFactory extends VehicleFactory {
    protected createVehicle(id: string, route: string) { return new Bus(id, route); }
    protected getPrefix() { return "BUS"; }
}

export class TramFactory extends VehicleFactory {
    protected createVehicle(id: string, route: string) { return new Tram(id, route); }
    protected getPrefix() { return "TRAM"; }
}

export class TaxiFactory extends VehicleFactory {
    protected createVehicle(id: string, route: string) { return new Taxi(id, route); }
    protected getPrefix() { return "TAXI"; }
}

const FACTORIES: Record<string, () => VehicleFactory> = {
    bus: () => new BusFactory(),
    tram: () => new TramFactory(),
    taxi: () => new TaxiFactory(),
};

export const VEHICLE_TYPES = Object.keys(FACTORIES);

export function createVehicleFactory(type: string): VehicleFactory {
    const create = FACTORIES[type.trim().toLowerCase()];
    if (!create) throw new Error(`Noma'lum transport turi: ${type}`);
    return create();
}
