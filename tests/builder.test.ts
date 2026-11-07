import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DistrictBuilder } from '../src/core/builders/DistrictBuilder.ts';
import { createDistrictFactory } from '../src/core/factories/DistrictFactory.ts';
import { VehicleFactory } from '../src/core/factories/VehicleFactory.ts';
import { District } from '../src/models/District.ts';

describe("Builder: DistrictBuilder", () => {
    beforeEach(() => VehicleFactory.resetCounters());

    test("tumanni bosqichma-bosqich quradi", () => {
        const district = new DistrictBuilder()
            .setName("Chilonzor")
            .setFactory(createDistrictFactory("residential"))
            .setPopulation(270000)
            .addLights(3, "Bunyodkor")
            .addVehicles(2, "Markaz")
            .addCameras("Metro", "Bozor")
            .setEnergyLimit(250)
            .build();

        assert.ok(district instanceof District);
        assert.equal(district.getName(), "Chilonzor");
        assert.equal(district.getType(), "Turar-joy");
        assert.equal(district.getPopulation(), 270000);
        assert.deepEqual(district.getLights().map(l => l.getId()), ["CHI-L1", "CHI-L2", "CHI-L3"]);
        assert.equal(district.getVehicles().length, 2);
        assert.deepEqual(district.getCameras(), ["Metro", "Bozor"]);
        assert.equal(district.getEnergyLimit(), 250);
    });

    test("har bir metod builderning o'zini qaytaradi", () => {
        const builder = new DistrictBuilder();
        assert.equal(builder.setName("A"), builder);
        assert.equal(builder.setFactory(createDistrictFactory("business")), builder);
        assert.equal(builder.setPopulation(1), builder);
        assert.equal(builder.addCameras("X"), builder);
    });

    test("bir necha marta chaqirilsa elementlar qo'shilib boradi", () => {
        const district = new DistrictBuilder()
            .setName("Sergeli")
            .setFactory(createDistrictFactory("industrial"))
            .setPopulation(10)
            .addLights(2, "A")
            .addLights(1, "B")
            .build();
        assert.deepEqual(district.getLights().map(l => l.getLocation()), ["A", "A", "B"]);
    });

    test("fabrikasiz chiroq qo'shib bo'lmaydi", () => {
        assert.throws(() => new DistrictBuilder().setName("A").addLights(1, "K"), /setFactory/);
    });

    test("nomsiz yoki aholisiz tuman qurilmaydi", () => {
        assert.throws(() => new DistrictBuilder().setFactory(createDistrictFactory("business")).build(), /setName/);
        assert.throws(() => new DistrictBuilder().setName("A").setFactory(createDistrictFactory("business")).build(), /Aholi/);
    });

    test("noto'g'ri qiymatlar rad etiladi", () => {
        const builder = new DistrictBuilder();
        assert.throws(() => builder.setName("   "), /bo'sh/);
        assert.throws(() => builder.setPopulation(-5), /musbat/);
        assert.throws(() => builder.setEnergyLimit(0), /musbat/);
        assert.throws(() => builder.setName("A").setFactory(createDistrictFactory("business")).addLights(-1, "K"), /butun son/);
    });

    test("build() dan keyin builder tozalanadi", () => {
        const builder = new DistrictBuilder()
            .setName("A")
            .setFactory(createDistrictFactory("business"))
            .setPopulation(1);
        builder.build();
        assert.throws(() => builder.build(), /setName/);
    });

    test("bo'sh kamera nomlari tashlab yuboriladi", () => {
        const district = new DistrictBuilder()
            .setName("A")
            .setFactory(createDistrictFactory("business"))
            .setPopulation(1)
            .addCameras(" Metro ", "", "  ")
            .build();
        assert.deepEqual(district.getCameras(), ["Metro"]);
    });
});
