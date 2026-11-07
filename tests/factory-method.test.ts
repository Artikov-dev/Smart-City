import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
    BusFactory, TaxiFactory, TramFactory, VehicleFactory, createVehicleFactory, VEHICLE_TYPES,
} from '../src/core/factories/VehicleFactory.ts';
import { Bus } from '../src/modules/transport/vehicles/Bus.ts';
import { Tram } from '../src/modules/transport/vehicles/Tram.ts';
import { Taxi } from '../src/modules/transport/vehicles/Taxi.ts';
import { TransportSystem } from '../src/modules/transport/TransportSystem.ts';

describe("Factory Method: VehicleFactory", () => {
    beforeEach(() => VehicleFactory.resetCounters());

    test("har bir fabrika o'z turidagi transportni yaratadi", () => {
        assert.ok(new BusFactory().deploy("A") instanceof Bus);
        assert.ok(new TramFactory().deploy("A") instanceof Tram);
        assert.ok(new TaxiFactory().deploy("A") instanceof Taxi);
    });

    test("yaratilgan transport yo'nalish va xususiyatlarga ega", () => {
        const bus = new BusFactory().deploy("Chilonzor - Markaz");
        assert.equal(bus.getType(), "Avtobus");
        assert.equal(bus.getRoute(), "Chilonzor - Markaz");
        assert.equal(bus.getCapacity(), 80);
        assert.ok(bus.getPowerUsage() > 0);
    });

    test("ID lar har bir tur uchun alohida ketma-ket beriladi", () => {
        assert.equal(new BusFactory().deploy("A").getId(), "BUS-1");
        assert.equal(new BusFactory().deploy("A").getId(), "BUS-2");
        assert.equal(new TramFactory().deploy("A").getId(), "TRAM-1");
    });

    test("createVehicleFactory() turini nomi bo'yicha tanlaydi", () => {
        assert.ok(createVehicleFactory("bus") instanceof BusFactory);
        assert.ok(createVehicleFactory(" TRAM ") instanceof TramFactory);
        assert.ok(createVehicleFactory("Taxi") instanceof TaxiFactory);
        assert.deepEqual(VEHICLE_TYPES, ["bus", "tram", "taxi"]);
    });

    test("noma'lum tur uchun xato beradi", () => {
        assert.throws(() => createVehicleFactory("helicopter"), /Noma'lum transport turi/);
    });

    test("TransportSystem fabrikani bilmasdan transport chiqaradi", () => {
        const transport = new TransportSystem();
        VEHICLE_TYPES.forEach(type => transport.dispatch(createVehicleFactory(type), "Markaz"));
        assert.equal(transport.getVehicles().length, 3);
        assert.equal(transport.getTotalCapacity(), 80 + 150 + 4);
        assert.deepEqual(transport.countByType(), { Avtobus: 1, Tramvay: 1, Taksi: 1 });
    });
});
