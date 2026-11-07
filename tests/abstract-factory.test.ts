import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
    BusinessDistrictFactory, IndustrialDistrictFactory, ResidentialDistrictFactory,
    createDistrictFactory, DISTRICT_TYPES,
} from '../src/core/factories/DistrictFactory.ts';
import { VehicleFactory } from '../src/core/factories/VehicleFactory.ts';
import { EnergySavingLight, MotionSensorLight } from '../src/core/decorators/SmartLightDecorator.ts';
import { StreetLight } from '../src/modules/lighting/StreetLight.ts';
import { Bus } from '../src/modules/transport/vehicles/Bus.ts';
import { Tram } from '../src/modules/transport/vehicles/Tram.ts';
import { Taxi } from '../src/modules/transport/vehicles/Taxi.ts';

describe("Abstract Factory: DistrictFactory", () => {
    beforeEach(() => VehicleFactory.resetCounters());

    test("turar-joy oilasi: LED chiroq va avtobus", () => {
        const factory = new ResidentialDistrictFactory();
        assert.ok(factory.createLight("L1", "Ko'cha") instanceof EnergySavingLight);
        assert.ok(factory.createVehicle("Yo'nalish") instanceof Bus);
        assert.equal(factory.getDistrictType(), "Turar-joy");
    });

    test("biznes oilasi: sensorli chiroq va taksi", () => {
        const factory = new BusinessDistrictFactory();
        assert.ok(factory.createLight("L1", "Ko'cha") instanceof MotionSensorLight);
        assert.ok(factory.createVehicle("Yo'nalish") instanceof Taxi);
        assert.equal(factory.getDistrictType(), "Biznes");
    });

    test("sanoat oilasi: oddiy kuchli chiroq va tramvay", () => {
        const factory = new IndustrialDistrictFactory();
        assert.ok(factory.createLight("L1", "Ko'cha") instanceof StreetLight);
        assert.ok(factory.createVehicle("Yo'nalish") instanceof Tram);
        assert.equal(factory.getDistrictType(), "Sanoat");
    });

    test("oilalar energiya sarfi bo'yicha farqlanadi", () => {
        const usage = (type: string) => {
            const light = createDistrictFactory(type).createLight("L", "K");
            light.turnOn();
            return light.getPowerUsage();
        };
        assert.ok(usage("residential") < usage("business"));
        assert.ok(usage("business") < usage("industrial"));
    });

    test("createDistrictFactory() turini nomi bo'yicha tanlaydi", () => {
        assert.ok(createDistrictFactory("residential") instanceof ResidentialDistrictFactory);
        assert.ok(createDistrictFactory("BUSINESS") instanceof BusinessDistrictFactory);
        assert.ok(createDistrictFactory(" industrial ") instanceof IndustrialDistrictFactory);
        assert.deepEqual(DISTRICT_TYPES, ["residential", "business", "industrial"]);
    });

    test("noma'lum tuman turi uchun xato beradi", () => {
        assert.throws(() => createDistrictFactory("space"), /Noma'lum tuman turi/);
    });
});
