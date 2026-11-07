export interface ISubsystem {
    getName(): string;
    getStatus(): string;
    getPowerUsage(): number;
}
