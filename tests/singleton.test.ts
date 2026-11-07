import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CityController } from '../src/core/controller/CityController.ts';
import { Logger } from '../src/utils/Logger.ts';

describe("Singleton: CityController", () => {
    beforeEach(() => CityController.resetInstance());

    test("getInstance() har doim bitta obyektni qaytaradi", () => {
        assert.equal(CityController.getInstance(), CityController.getInstance());
    });

    test("holat barcha chaqiruvlar orasida umumiy", () => {
        CityController.getInstance().setEnergySaving(true);
        assert.equal(CityController.getInstance().getEnergyReport().savingMode, true);
    });

    test("resetInstance() dan keyin yangi obyekt yaratiladi", () => {
        const first = CityController.getInstance();
        CityController.resetInstance();
        assert.notEqual(CityController.getInstance(), first);
    });
});

describe("Singleton: Logger", () => {
    test("getInstance() har doim bitta obyektni qaytaradi", () => {
        assert.equal(Logger.getInstance(), Logger.getInstance());
    });

    test("yozuvlar barcha joyda umumiy", () => {
        const logger = Logger.getInstance();
        logger.clear();
        logger.info("birinchi");
        Logger.getInstance().warn("ikkinchi");
        const entries = Logger.getInstance().getEntries();
        assert.deepEqual(entries.map(e => e.level), ["INFO", "WARN"]);
        assert.equal(entries[1].message, "ikkinchi");
    });

    test("getLast() oxirgi yozuvlarni qaytaradi", () => {
        const logger = Logger.getInstance();
        logger.clear();
        ["a", "b", "c"].forEach(m => logger.info(m));
        assert.deepEqual(logger.getLast(2).map(e => e.message), ["b", "c"]);
    });
});
