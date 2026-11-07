# SmartCity System

Lab Work №1 — Artikov Rozimuhammadxon

A console application that simulates an intelligent city management system. Lighting, transport, security and energy subsystems are combined into one coherent city and controlled through a single console menu. The architecture is built with **8 design patterns**.

## Run

```bash
npm install        # only needed for type checking
npm start          # console application
npm test           # 60 unit tests (node:test)
npm run typecheck  # TypeScript strict type check
```

Requires Node.js 22.6+ — TypeScript runs directly via `--experimental-strip-types`, no build step.

## Design Patterns

Detailed documentation for every pattern (problem, solution, code, usage, tests): **[PATTERNS.md](PATTERNS.md)**.

| # | Pattern | Type | File | Purpose in the system |
|---|---------|------|------|-----------------------|
| 1 | **Singleton** | Creational | `core/controller/CityController.ts`, `utils/Logger.ts` | The city has exactly one control center and one shared event log. `getInstance()` always returns the same object, the constructor is private. |
| 2 | **Facade** | Structural | `core/controller/CityController.ts` | One simple interface over all subsystems. A single call such as `activateNightMode()` turns on the lights, arms security and checks energy at once; `main.ts` never touches the subsystems directly. |
| 3 | **Factory Method** | Creational | `core/factories/VehicleFactory.ts` | `VehicleFactory.deploy()` contains the shared logic (ID numbering, logging), while subclasses `BusFactory`, `TramFactory`, `TaxiFactory` decide which vehicle `createVehicle()` produces. |
| 4 | **Abstract Factory** | Creational | `core/factories/DistrictFactory.ts` | Each district type creates a consistent family of products: residential → LED lights + buses, business → motion-sensor lights + taxis, industrial → high-power lights + trams. |
| 5 | **Builder** | Creational | `core/builders/DistrictBuilder.ts` | A district has many optional parts (lights, vehicles, cameras, energy limit). The builder assembles it step by step with a fluent API and validates it in `build()`. |
| 6 | **Adapter** | Structural | `core/adapters/WeatherAdapter.ts` | The external weather service returns JSON with Fahrenheit and sky codes. The adapter converts it into the system's `IWeatherProvider` format (Celsius, readable condition, visibility flags) without changing the external class. |
| 7 | **Proxy** | Structural | `core/proxy/SecurityProxy.ts` | Protects the security subsystem: arming, disarming, cameras and incidents require an admin password, while status and the public alarm button stay open. Every access attempt is logged. |
| 8 | **Decorator** | Structural | `core/decorators/SmartLightDecorator.ts` | Adds smart features to any street light at runtime (`MotionSensorLight` −40% power, `EnergySavingLight` −50% power). Decorators can be stacked without changing `StreetLight`. |

## How the components work together

- `main.ts` → talks only to **CityController** (Facade + Singleton).
- New districts are assembled by **DistrictBuilder**, which takes products from an **Abstract Factory**.
- The Abstract Factory creates vehicles through **Factory Method** factories and lights wrapped in **Decorators**.
- Weather data arrives through the **Adapter** and changes lighting brightness and transport speed limits.
- The security subsystem is exposed to users only through the **Proxy**.
- `EnergySystem` sums the consumption of all subsystems through the common `ISubsystem` interface and warns via the **Logger** (Singleton) when the limit is exceeded.

## Console menu

```text
1. Shahar holati                 - full city report
2. Transport boshqaruvi          - list / dispatch / remove vehicles
3. Yoritish boshqaruvi           - lights on/off, brightness, Decorator upgrades
4. Xavfsizlik tizimi             - admin login (password: admin123), cameras, alarms
5. Energiya monitoringi          - consumption report, saving mode
6. Ob-havo ma'lumotini yangilash - weather via Adapter
7. Yangi tuman qurish            - interactive Builder
8. Tungi rejim                   - night mode (Facade)
9. Kunduzgi rejim                - day mode (Facade)
10. Tizim jurnali                - event log (Logger)
0. Chiqish
```

On start the city is created with three districts: Chilonzor (residential), Yunusobod (business) and Sergeli (industrial).

## Tests

| File | Pattern | Tests |
|------|---------|-------|
| `tests/singleton.test.ts` | Singleton | 6 |
| `tests/facade.test.ts` | Facade | 11 |
| `tests/factory-method.test.ts` | Factory Method | 6 |
| `tests/abstract-factory.test.ts` | Abstract Factory | 6 |
| `tests/builder.test.ts` | Builder | 8 |
| `tests/adapter.test.ts` | Adapter | 8 |
| `tests/proxy.test.ts` | Proxy | 8 |
| `tests/decorator.test.ts` | Decorator | 7 |
| **Total** | | **60** |

## Project Structure

```text
Artikov_Rozimuhammadxon/
├── src/
│   ├── main.ts                              # console menu, entry point
│   ├── core/
│   │   ├── controller/CityController.ts     # Singleton + Facade
│   │   ├── factories/
│   │   │   ├── VehicleFactory.ts            # Factory Method
│   │   │   └── DistrictFactory.ts           # Abstract Factory
│   │   ├── builders/DistrictBuilder.ts      # Builder
│   │   ├── adapters/
│   │   │   ├── WeatherAdapter.ts            # Adapter
│   │   │   └── external/ExternalWeatherService.ts
│   │   ├── proxy/SecurityProxy.ts           # Proxy
│   │   ├── decorators/SmartLightDecorator.ts # Decorator
│   │   └── interfaces/                      # ISubsystem, IVehicle, ILight, IWeatherProvider, ISecuritySystem
│   ├── modules/
│   │   ├── lighting/    LightingSystem.ts, StreetLight.ts
│   │   ├── transport/   TransportSystem.ts, vehicles/ (Vehicle, Bus, Tram, Taxi)
│   │   ├── security/    SecuritySystem.ts
│   │   └── energy/      EnergySystem.ts
│   ├── models/District.ts                   # product of the Builder
│   └── utils/
│       ├── Logger.ts                        # Singleton
│       └── ConsoleUI.ts                     # colors, frames, progress bar
├── tests/                                   # 8 test files, 60 tests
├── package.json
├── tsconfig.json
└── README.md
```
