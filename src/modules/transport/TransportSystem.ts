import type { ISubsystem } from '../../core/interfaces/ISubsystem.ts';
import type { IVehicle } from '../../core/interfaces/IVehicle.ts';
import type { WeatherInfo } from '../../core/interfaces/IWeatherProvider.ts';
import type { VehicleFactory } from '../../core/factories/VehicleFactory.ts';

export class TransportSystem implements ISubsystem {
    static readonly NORMAL_SPEED = 60;
    private vehicles: IVehicle[] = [];
    private speedLimit = TransportSystem.NORMAL_SPEED;

    getName() { return "Transport"; }

    addVehicle(vehicle: IVehicle) { this.vehicles.push(vehicle); }

    dispatch(factory: VehicleFactory, route: string) {
        const vehicle = factory.deploy(route);
        this.addVehicle(vehicle);
        return vehicle;
    }

    removeVehicle(id: string) {
        const index = this.vehicles.findIndex(v => v.getId().toLowerCase() === id.trim().toLowerCase());
        if (index === -1) return false;
        this.vehicles.splice(index, 1);
        return true;
    }

    getVehicles() { return [...this.vehicles]; }
    getTotalCapacity() { return this.vehicles.reduce((sum, v) => sum + v.getCapacity(), 0); }
    getSpeedLimit() { return this.speedLimit; }

    countByType() {
        const counts: Record<string, number> = {};
        this.vehicles.forEach(v => { counts[v.getType()] = (counts[v.getType()] ?? 0) + 1; });
        return counts;
    }

    adjustToWeather(weather: WeatherInfo) {
        if (weather.poorVisibility) this.speedLimit = 30;
        else if (weather.precipitation) this.speedLimit = 40;
        else this.speedLimit = TransportSystem.NORMAL_SPEED;
        return `Tezlik chegarasi: ${this.speedLimit} km/soat`;
    }

    getPowerUsage() { return this.vehicles.reduce((sum, v) => sum + v.getPowerUsage(), 0); }

    getStatus() {
        return `${this.vehicles.length} ta transport, ${this.getTotalCapacity()} o'rin, tezlik chegarasi ${this.speedLimit} km/soat`;
    }
}
