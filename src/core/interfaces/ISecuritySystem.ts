import type { ISubsystem } from './ISubsystem.ts';

export interface ISecuritySystem extends ISubsystem {
    arm(): void;
    disarm(): void;
    isArmed(): boolean;
    addCamera(location: string): void;
    getCameras(): string[];
    triggerAlarm(zone: string): string;
    getIncidents(): string[];
}
