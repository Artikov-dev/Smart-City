import type { ILight } from '../interfaces/ILight.ts';
import type { IVehicle } from '../interfaces/IVehicle.ts';
import type { DistrictFactory } from '../factories/DistrictFactory.ts';
import { District } from '../../models/District.ts';

export class DistrictBuilder {
    private name = "";
    private factory: DistrictFactory | null = null;
    private population = 0;
    private lights: ILight[] = [];
    private vehicles: IVehicle[] = [];
    private cameras: string[] = [];
    private energyLimit = 100;

    setName(name: string) {
        if (!name.trim()) throw new Error("Tuman nomi bo'sh bo'lishi mumkin emas");
        this.name = name.trim();
        return this;
    }

    setFactory(factory: DistrictFactory) {
        this.factory = factory;
        return this;
    }

    setPopulation(population: number) {
        if (!Number.isInteger(population) || population <= 0) {
            throw new Error("Aholi soni musbat butun son bo'lishi kerak");
        }
        this.population = population;
        return this;
    }

    addLights(count: number, street: string) {
        this.checkCount(count);
        const factory = this.requireFactory();
        const prefix = this.requireName().slice(0, 3).toUpperCase();
        for (let i = 0; i < count; i++) {
            this.lights.push(factory.createLight(`${prefix}-L${this.lights.length + 1}`, street));
        }
        return this;
    }

    addVehicles(count: number, route: string) {
        this.checkCount(count);
        const factory = this.requireFactory();
        for (let i = 0; i < count; i++) this.vehicles.push(factory.createVehicle(route));
        return this;
    }

    addCameras(...locations: string[]) {
        locations.map(l => l.trim()).filter(Boolean).forEach(l => this.cameras.push(l));
        return this;
    }

    setEnergyLimit(kw: number) {
        if (!(kw > 0)) throw new Error("Energiya limiti musbat bo'lishi kerak");
        this.energyLimit = kw;
        return this;
    }

    build(): District {
        const name = this.requireName();
        const factory = this.requireFactory();
        if (this.population <= 0) throw new Error("Aholi soni ko'rsatilmagan: setPopulation() chaqiring");
        const district = new District({
            name,
            type: factory.getDistrictType(),
            population: this.population,
            lights: this.lights,
            vehicles: this.vehicles,
            cameras: this.cameras,
            energyLimit: this.energyLimit,
        });
        this.reset();
        return district;
    }

    reset() {
        this.name = "";
        this.factory = null;
        this.population = 0;
        this.lights = [];
        this.vehicles = [];
        this.cameras = [];
        this.energyLimit = 100;
        return this;
    }

    private requireName() {
        if (!this.name) throw new Error("Avval setName() chaqiring");
        return this.name;
    }

    private requireFactory() {
        if (!this.factory) throw new Error("Avval setFactory() chaqiring");
        return this.factory;
    }

    private checkCount(count: number) {
        if (!Number.isInteger(count) || count < 0) throw new Error("Soni manfiy bo'lmagan butun son bo'lishi kerak");
    }
}
