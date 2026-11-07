import type { ISubsystem } from '../../core/interfaces/ISubsystem.ts';

export interface ConsumerUsage {
    name: string;
    usage: number;
}

export interface EnergyReport {
    consumers: ConsumerUsage[];
    total: number;
    limit: number;
    percent: number;
    overLimit: boolean;
    savingMode: boolean;
}

export class EnergySystem implements ISubsystem {
    private consumers: ISubsystem[] = [];
    private limit: number;
    private savingMode = false;

    constructor(limit = 50) { this.limit = limit; }

    getName() { return "Energiya"; }

    addConsumer(consumer: ISubsystem) { this.consumers.push(consumer); }

    getLimit() { return this.limit; }

    increaseLimit(kw: number) {
        if (kw < 0) throw new Error("Limitni manfiy songa oshirib bo'lmaydi");
        this.limit += kw;
    }

    isSavingMode() { return this.savingMode; }
    setSavingMode(enabled: boolean) { this.savingMode = enabled; }

    getTotalUsage() { return this.consumers.reduce((sum, c) => sum + c.getPowerUsage(), 0); }
    isOverLimit() { return this.getTotalUsage() > this.limit; }

    getReport(): EnergyReport {
        const consumers = this.consumers.map(c => ({ name: c.getName(), usage: c.getPowerUsage() }));
        const total = consumers.reduce((sum, c) => sum + c.usage, 0);
        return {
            consumers,
            total,
            limit: this.limit,
            percent: this.limit > 0 ? (total / this.limit) * 100 : 0,
            overLimit: total > this.limit,
            savingMode: this.savingMode,
        };
    }

    getPowerUsage() { return 0.5; }

    getStatus() {
        const r = this.getReport();
        return `${r.total.toFixed(1)} / ${r.limit} kW (${r.percent.toFixed(0)}%)` +
            `${r.overLimit ? " - LIMIT OSHDI!" : ""}${r.savingMode ? ", tejash rejimi" : ""}`;
    }
}
