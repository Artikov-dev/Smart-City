import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SecurityProxy, AccessDeniedError } from '../src/core/proxy/SecurityProxy.ts';
import { SecuritySystem } from '../src/modules/security/SecuritySystem.ts';

describe("Proxy: SecurityProxy", () => {
    let real: SecuritySystem;
    let proxy: SecurityProxy;

    beforeEach(() => {
        real = new SecuritySystem();
        real.addCamera("Metro");
        proxy = new SecurityProxy(real, "secret");
    });

    test("kirmasdan himoyalangan amallar bloklanadi", () => {
        assert.throws(() => proxy.arm(), AccessDeniedError);
        assert.throws(() => proxy.disarm(), AccessDeniedError);
        assert.throws(() => proxy.getCameras(), AccessDeniedError);
        assert.throws(() => proxy.addCamera("X"), AccessDeniedError);
        assert.throws(() => proxy.getIncidents(), AccessDeniedError);
        assert.equal(real.isArmed(), false);
        assert.deepEqual(real.getCameras(), ["Metro"]);
    });

    test("noto'g'ri parol bilan kirib bo'lmaydi", () => {
        assert.equal(proxy.login("1234"), false);
        assert.equal(proxy.isAuthenticated(), false);
        assert.throws(() => proxy.arm(), AccessDeniedError);
    });

    test("to'g'ri parol bilan amallar haqiqiy tizimga uzatiladi", () => {
        assert.equal(proxy.login("secret"), true);
        proxy.arm();
        proxy.addCamera("Bozor");
        assert.equal(real.isArmed(), true);
        assert.deepEqual(proxy.getCameras(), ["Metro", "Bozor"]);
    });

    test("logout() dan keyin yana bloklanadi", () => {
        proxy.login("secret");
        proxy.logout();
        assert.throws(() => proxy.getCameras(), AccessDeniedError);
    });

    test("ochiq amallar parolsiz ishlaydi", () => {
        assert.equal(proxy.isArmed(), false);
        assert.equal(proxy.getName(), "Xavfsizlik");
        assert.match(proxy.getStatus(), /1 ta kamera/);
        assert.match(proxy.triggerAlarm("Bozor"), /qayd etildi/);
        assert.equal(real.getIncidents().length, 1);
    });

    test("faol tizimda signal patrul chaqiradi", () => {
        proxy.login("secret");
        proxy.arm();
        assert.match(proxy.triggerAlarm("Metro"), /Patrul/);
    });

    test("kirish jurnali barcha urinishlarni yozadi", () => {
        assert.throws(() => proxy.arm());
        proxy.login("xato");
        proxy.login("secret");
        proxy.arm();
        const log = proxy.getAccessLog().join("\n");
        assert.match(log, /RAD ETILDI: Tizimni yoqish/);
        assert.match(log, /Noto'g'ri parol/);
        assert.match(log, /Ruxsat berildi: Tizimni yoqish/);
    });

    test("xato xabari amal nomini ko'rsatadi", () => {
        assert.throws(() => proxy.disarm(), { name: "AccessDeniedError", message: /Tizimni o'chirish/ });
    });
});
