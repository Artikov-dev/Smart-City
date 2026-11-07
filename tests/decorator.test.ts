import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { EnergySavingLight, MotionSensorLight, upgradeLight } from '../src/core/decorators/SmartLightDecorator.ts';
import { StreetLight } from '../src/modules/lighting/StreetLight.ts';

const approx = (actual: number, expected: number) =>
    assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

function litLamp(power = 100) {
    const light = new StreetLight("L1", "Ko'cha", power);
    light.turnOn();
    return light;
}

describe("Decorator: SmartLightDecorator", () => {
    test("harakat sensori energiyani 40% kamaytiradi", () => {
        approx(new MotionSensorLight(litLamp()).getPowerUsage(), 60);
    });

    test("LED tejamkor energiyani 50% kamaytiradi", () => {
        approx(new EnergySavingLight(litLamp()).getPowerUsage(), 50);
    });

    test("dekoratorlarni ustma-ust qo'llash mumkin", () => {
        const light = new EnergySavingLight(new MotionSensorLight(litLamp()));
        approx(light.getPowerUsage(), 30);
        assert.deepEqual(light.getFeatures(), ["harakat sensori", "LED tejamkor"]);
        assert.match(light.describe(), /\+harakat sensori \+LED tejamkor/);
    });

    test("asosiy obyekt o'zgarmaydi, faqat o'raladi", () => {
        const base = litLamp();
        new MotionSensorLight(base);
        approx(base.getPowerUsage(), 100);
        assert.deepEqual(base.getFeatures(), []);
    });

    test("boshqaruv buyruqlari asosiy chiroqqa uzatiladi", () => {
        const base = new StreetLight("L7", "Ko'cha", 200);
        const light = new MotionSensorLight(base);
        light.turnOn();
        light.setBrightness(50);
        assert.equal(base.isOn(), true);
        assert.equal(base.getBrightness(), 50);
        assert.equal(light.getId(), "L7");
        approx(light.getPowerUsage(), 60);
        light.turnOff();
        assert.equal(light.getPowerUsage(), 0);
    });

    test("upgradeLight() turini nomi bo'yicha qo'llaydi", () => {
        assert.ok(upgradeLight(litLamp(), "motion") instanceof MotionSensorLight);
        assert.ok(upgradeLight(litLamp(), "eco") instanceof EnergySavingLight);
    });

    test("upgradeLight() takroriy va noma'lum yangilashni rad etadi", () => {
        const once = upgradeLight(litLamp(), "eco");
        assert.throws(() => upgradeLight(once, "eco"), /allaqachon bor/);
        assert.throws(() => upgradeLight(litLamp(), "laser"), /Noma'lum/);
    });
});
