import type { ILight } from '../interfaces/ILight.ts';
import type { IVehicle } from '../interfaces/IVehicle.ts';
import { StreetLight } from '../../modules/lighting/StreetLight.ts';
import { EnergySavingLight, MotionSensorLight } from '../decorators/SmartLightDecorator.ts';
import { BusFactory, TaxiFactory, TramFactory, type VehicleFactory } from './VehicleFactory.ts';

export interface DistrictFactory {
    getDistrictType(): string;
    createLight(id: string, location: string): ILight;
    createVehicle(route: string): IVehicle;
}

export class ResidentialDistrictFactory implements DistrictFactory {
    private vehicles: VehicleFactory = new BusFactory();
    getDistrictType() { return "Turar-joy"; }
    createLight(id: string, location: string) { return new EnergySavingLight(new StreetLight(id, location, 100)); }
    createVehicle(route: string) { return this.vehicles.deploy(route); }
}

export class BusinessDistrictFactory implements DistrictFactory {
    private vehicles: VehicleFactory = new TaxiFactory();
    getDistrictType() { return "Biznes"; }
    createLight(id: string, location: string) { return new MotionSensorLight(new StreetLight(id, location, 150)); }
    createVehicle(route: string) { return this.vehicles.deploy(route); }
}

export class IndustrialDistrictFactory implements DistrictFactory {
    private vehicles: VehicleFactory = new TramFactory();
    getDistrictType() { return "Sanoat"; }
    createLight(id: string, location: string) { return new StreetLight(id, location, 250); }
    createVehicle(route: string) { return this.vehicles.deploy(route); }
}

const FACTORIES: Record<string, () => DistrictFactory> = {
    residential: () => new ResidentialDistrictFactory(),
    business: () => new BusinessDistrictFactory(),
    industrial: () => new IndustrialDistrictFactory(),
};

export const DISTRICT_TYPES = Object.keys(FACTORIES);

export function createDistrictFactory(type: string): DistrictFactory {
    const create = FACTORIES[type.trim().toLowerCase()];
    if (!create) throw new Error(`Noma'lum tuman turi: ${type}`);
    return create();
}
