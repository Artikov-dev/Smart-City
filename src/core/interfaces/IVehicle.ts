export interface IVehicle {
    getId(): string;
    getType(): string;
    getRoute(): string;
    setRoute(route: string): void;
    getCapacity(): number;
    getPowerUsage(): number;
    describe(): string;
}
