import type { ISecuritySystem } from '../../core/interfaces/ISecuritySystem.ts';
import { Logger } from '../../utils/Logger.ts';

export class SecuritySystem implements ISecuritySystem {
    private armed = false;
    private cameras: string[] = [];
    private incidents: string[] = [];

    getName() { return "Xavfsizlik"; }

    arm() {
        this.armed = true;
        Logger.getInstance().info("Xavfsizlik tizimi faollashtirildi");
    }

    disarm() {
        this.armed = false;
        Logger.getInstance().info("Xavfsizlik tizimi o'chirildi");
    }

    isArmed() { return this.armed; }

    addCamera(location: string) {
        const name = location.trim();
        if (!name) throw new Error("Kamera joyi bo'sh bo'lishi mumkin emas");
        this.cameras.push(name);
    }

    getCameras() { return [...this.cameras]; }

    triggerAlarm(zone: string) {
        const place = zone.trim() || "Noma'lum hudud";
        const message = this.armed
            ? `${place}: signal! Patrul yuborildi`
            : `${place}: signal qayd etildi (tizim o'chiq)`;
        this.incidents.push(message);
        Logger.getInstance().warn(message);
        return message;
    }

    getIncidents() { return [...this.incidents]; }

    getPowerUsage() { return this.cameras.length * 0.05 + (this.armed ? 2 : 0); }

    getStatus() {
        return `${this.armed ? "faol" : "o'chiq"}, ${this.cameras.length} ta kamera, ${this.incidents.length} ta hodisa`;
    }
}
