import type { ISecuritySystem } from '../interfaces/ISecuritySystem.ts';
import { Logger } from '../../utils/Logger.ts';

export class AccessDeniedError extends Error {
    constructor(action: string) {
        super(`Ruxsat yo'q: "${action}" amali uchun admin sifatida kiring`);
        this.name = "AccessDeniedError";
    }
}

export class SecurityProxy implements ISecuritySystem {
    private real: ISecuritySystem;
    private password: string;
    private authenticated = false;
    private accessLog: string[] = [];

    constructor(real: ISecuritySystem, password: string) {
        this.real = real;
        this.password = password;
    }

    login(password: string) {
        this.authenticated = password === this.password;
        this.record(this.authenticated ? "Kirish muvaffaqiyatli" : "Noto'g'ri parol");
        if (!this.authenticated) Logger.getInstance().warn("Xavfsizlik tizimiga noto'g'ri parol bilan kirishga urinish");
        return this.authenticated;
    }

    logout() {
        this.authenticated = false;
        this.record("Chiqish");
    }

    isAuthenticated() { return this.authenticated; }
    getAccessLog() { return [...this.accessLog]; }

    getName() { return this.real.getName(); }
    getStatus() { return this.real.getStatus(); }
    getPowerUsage() { return this.real.getPowerUsage(); }
    isArmed() { return this.real.isArmed(); }

    triggerAlarm(zone: string) {
        this.record(`Signal: ${zone}`);
        return this.real.triggerAlarm(zone);
    }

    arm() {
        this.authorize("Tizimni yoqish");
        this.real.arm();
    }

    disarm() {
        this.authorize("Tizimni o'chirish");
        this.real.disarm();
    }

    addCamera(location: string) {
        this.authorize("Kamera qo'shish");
        this.real.addCamera(location);
    }

    getCameras() {
        this.authorize("Kameralarni ko'rish");
        return this.real.getCameras();
    }

    getIncidents() {
        this.authorize("Hodisalarni ko'rish");
        return this.real.getIncidents();
    }

    private authorize(action: string) {
        if (!this.authenticated) {
            this.record(`RAD ETILDI: ${action}`);
            Logger.getInstance().warn(`Ruxsatsiz urinish: ${action}`);
            throw new AccessDeniedError(action);
        }
        this.record(`Ruxsat berildi: ${action}`);
    }

    private record(event: string) {
        this.accessLog.push(`${new Date().toLocaleTimeString("en-GB")} ${event}`);
    }
}
