import * as readline from "node:readline";
import { CityController, DEFAULT_SECURITY_PASSWORD } from './core/controller/CityController.ts';
import { DistrictBuilder } from './core/builders/DistrictBuilder.ts';
import { createDistrictFactory, DISTRICT_TYPES } from './core/factories/DistrictFactory.ts';
import { VEHICLE_TYPES } from './core/factories/VehicleFactory.ts';
import { LIGHT_UPGRADES } from './core/decorators/SmartLightDecorator.ts';
import { AccessDeniedError } from './core/proxy/SecurityProxy.ts';
import { Logger } from './utils/Logger.ts';
import { bar, box, color, fail, item, note, ok, option, pad, prompt, warn } from './utils/ConsoleUI.ts';

type Action = [string, () => Promise<void> | void];

class ExitSignal extends Error {}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = rl[Symbol.asyncIterator]();
const city = CityController.getInstance();

async function ask(question: string): Promise<string> {
    process.stdout.write(prompt(question));
    const next = await lines.next();
    if (next.done) throw new ExitSignal();
    return String(next.value).trim();
}

async function askNumber(question: string, min: number, max: number): Promise<number> {
    while (true) {
        const answer = await ask(question);
        const value = Number(answer);
        if (answer !== "" && Number.isInteger(value) && value >= min && value <= max) return value;
        fail(`${min} dan ${max} gacha butun son kiriting`);
    }
}

async function pick(question: string, labels: string[]) {
    labels.forEach((label, i) => console.log(option(i + 1, label)));
    return (await askNumber(question, 1, labels.length)) - 1;
}

async function menu(title: string, actions: Action[], back = "Orqaga", header?: () => string[]) {
    while (true) {
        console.log("\n" + box(title, header ? header() : []));
        actions.forEach(([label], i) => console.log(option(i + 1, label)));
        console.log(option(0, color.gray(back)));
        const choice = await askNumber("Tanlang: ", 0, actions.length);
        if (choice === 0) return;
        console.log();
        try {
            await actions[choice - 1][1]();
        } catch (error) {
            if (error instanceof ExitSignal) throw error;
            fail(error instanceof AccessDeniedError ? color.red((error as Error).message) : `Xato: ${(error as Error).message}`);
        }
    }
}

function printList(items: string[], empty: string) {
    if (items.length === 0) note(empty);
    items.forEach(item);
}

const label = (text: string) => color.gray(text.padEnd(11));
const modeLabel = () => city.isNightMode() ? color.magenta("Tungi") : color.yellow("Kunduzgi");
const onOff = (on: boolean, yes: string, no: string) => on ? color.green(`● ${yes}`) : color.gray(`○ ${no}`);

function setupCity() {
    city.addDistrict(new DistrictBuilder()
        .setName("Chilonzor")
        .setFactory(createDistrictFactory("residential"))
        .setPopulation(270000)
        .addLights(6, "Bunyodkor shoh ko'chasi")
        .addVehicles(3, "Chilonzor - Markaz")
        .addCameras("Chilonzor metro bekati", "Chorsu bozori")
        .setEnergyLimit(250)
        .build());

    city.addDistrict(new DistrictBuilder()
        .setName("Yunusobod")
        .setFactory(createDistrictFactory("business"))
        .setPopulation(330000)
        .addLights(4, "Amir Temur shoh ko'chasi")
        .addVehicles(4, "Yunusobod - Aeroport")
        .addCameras("Biznes markaz", "Mega Planet")
        .setEnergyLimit(150)
        .build());

    city.addDistrict(new DistrictBuilder()
        .setName("Sergeli")
        .setFactory(createDistrictFactory("industrial"))
        .setPopulation(190000)
        .addLights(3, "Sanoat zonasi")
        .addVehicles(2, "Sergeli - Chilonzor")
        .addCameras("Zavod darvozasi")
        .setEnergyLimit(300)
        .build());
}

function showCityReport() {
    const w = city.getLastWeather();
    const weather = w ? `${w.city}, ${w.temperature}°C, ${w.condition}` : color.dim("ma'lumot yo'q");
    console.log(box("SHAHAR HOLATI", [
        `${label("Rejim")}${modeLabel()}`,
        `${label("Aholi")}${city.getTotalPopulation().toLocaleString("en-US")}`,
        `${label("Ob-havo")}${weather}`,
        "",
        color.bold("Tumanlar"),
        ...city.getDistricts().map(d =>
            `${color.cyan("▸")} ${pad(color.bold(d.getName()), 10)} ${pad(color.gray(d.getType()), 11)}` +
            `${d.getLights().length} chiroq · ${d.getVehicles().length} transport · ${d.getCameras().length} kamera`),
        "",
        color.bold("Tizimlar"),
        ...city.getSubsystems().map(s => `${color.cyan("▸")} ${pad(s.getName(), 11)}${s.getStatus()}`),
    ]));
}

async function transportMenu() {
    const labels = ["Avtobus", "Tramvay", "Taksi"];
    await menu("TRANSPORT", [
        ["Transportlar ro'yxati", () => {
            printList(city.getVehicles().map(v =>
                `${pad(color.bold(v.getId()), 8)} ${pad(v.getType(), 8)} ${pad(color.gray(v.getRoute()), 22)}` +
                ` ${String(v.getCapacity()).padStart(3)} o'rin  ${String(v.getPowerUsage()).padStart(3)} kW`), "Transport yo'q");
            note(`Tezlik chegarasi: ${city.getSpeedLimit()} km/soat`);
        }],
        ["Yangi transport chiqarish", async () => {
            const type = await pick("Transport turi: ", labels);
            const route = await ask("Yo'nalish: ");
            ok(`Chiqarildi: ${city.dispatchVehicle(VEHICLE_TYPES[type], route).describe()}`);
        }],
        ["Transportni olib tashlash", async () => {
            const id = await ask("Transport ID (masalan BUS-1): ");
            if (city.removeVehicle(id)) ok("Olib tashlandi");
            else fail("Bunday transport topilmadi");
        }],
    ], "Orqaga", () => [city.getSubsystems()[1].getStatus()]);
}

async function lightingMenu() {
    const labels = ["Harakat sensori (-40% energiya)", "LED tejamkor (-50% energiya)"];
    await menu("YORITISH", [
        ["Chiroqlar ro'yxati", () => {
            printList(city.getLights().map(l => {
                const features = l.getFeatures().length ? color.cyan(l.getFeatures().join(", ")) : color.gray("oddiy");
                return `${pad(color.bold(l.getId()), 8)} ${pad(onOff(l.isOn(), "yoniq", "o'chiq"), 9)}` +
                    ` ${String(l.getBrightness()).padStart(3)}%  ${l.getPowerUsage().toFixed(1).padStart(6)} W  ${features}`;
            }), "Chiroq yo'q");
        }],
        ["Barcha chiroqlarni yoqish", () => { city.turnLightsOn(); ok("Barcha chiroqlar yoqildi"); }],
        ["Barcha chiroqlarni o'chirish", () => { city.turnLightsOff(); ok("Barcha chiroqlar o'chirildi"); }],
        ["Yorqinlikni o'zgartirish", async () => {
            const level = await askNumber("Yorqinlik (0-100): ", 0, 100);
            city.setBrightness(level);
            ok(`Yorqinlik ${level}%`);
        }],
        ["Chiroqni yangilash (Decorator)", async () => {
            const id = await ask("Chiroq ID (masalan SER-L1): ");
            const kind = await pick("Yangilash turi: ", labels);
            ok(`Yangilandi: ${city.upgradeLight(id, LIGHT_UPGRADES[kind]).describe()}`);
        }],
    ], "Orqaga", () => [city.getSubsystems()[0].getStatus()]);
}

async function securityMenu() {
    const security = city.getSecurity();
    await menu("XAVFSIZLIK", [
        ["Admin sifatida kirish", async () => {
            const password = await ask(`Parol ${color.gray(`(demo: ${DEFAULT_SECURITY_PASSWORD})`)}: `);
            if (security.login(password)) ok("Kirish muvaffaqiyatli");
            else fail("Noto'g'ri parol");
        }],
        ["Tizimni yoqish", () => { security.arm(); ok("Tizim faollashtirildi"); }],
        ["Tizimni o'chirish", () => { security.disarm(); ok("Tizim o'chirildi"); }],
        ["Kameralar ro'yxati", () => printList(security.getCameras(), "Kamera yo'q")],
        ["Kamera qo'shish", async () => {
            security.addCamera(await ask("Kamera joyi: "));
            ok("Kamera qo'shildi");
        }],
        ["Hodisalar jurnali", () => printList(security.getIncidents(), "Hodisa yo'q")],
        ["Signal berish " + color.gray("(hamma uchun ochiq)"), async () => {
            warn(security.triggerAlarm(await ask("Hudud: ")));
        }],
        ["Kirish jurnali", () => printList(security.getAccessLog().map(e =>
            e.includes("RAD") || e.includes("Noto'g'ri") ? color.red(e) : e), "Yozuv yo'q")],
        ["Chiqish (logout)", () => { security.logout(); ok("Tizimdan chiqildi"); }],
    ], "Orqaga", () => [
        `${label("Holat")}${security.getStatus()}`,
        `${label("Admin")}${onOff(security.isAuthenticated(), "kirgan", "kirmagan")}`,
    ]);
}

function showEnergyReport() {
    const report = city.getEnergyReport();
    const rows = report.consumers.map(c => `${pad(c.name, 12)}${c.usage.toFixed(2).padStart(9)} kW`);
    console.log(box("ENERGIYA HISOBOTI", [
        ...rows,
        color.gray("─".repeat(23)),
        `${pad(color.bold("Jami"), 12)}${color.bold(report.total.toFixed(2).padStart(9))} kW / ${report.limit} kW`,
        "",
        bar(report.percent),
        `${label("Tejash")}${onOff(report.savingMode, "yoqilgan", "o'chiq")}`,
    ], report.overLimit ? color.red : color.cyan));
    if (report.overLimit) warn(color.yellow("Energiya limiti oshdi! Tejash rejimini yoqing yoki transportni kamaytiring"));
}

async function energyMenu() {
    await menu("ENERGIYA", [
        ["Energiya hisoboti", showEnergyReport],
        ["Tejash rejimini yoqish", () => { city.setEnergySaving(true); ok("Chiroqlar 50% ga tushirildi"); }],
        ["Tejash rejimini o'chirish", () => { city.setEnergySaving(false); ok("Chiroqlar 100% ga qaytarildi"); }],
    ]);
}

async function weatherAction() {
    note(`Shaharlar: ${city.getWeatherCities().join(", ")}`);
    const result = city.updateWeather(await ask("Shahar nomi: "));
    const w = result.weather;
    console.log(box(`OB-HAVO: ${w.city.toUpperCase()}`, [
        `${label("Harorat")}${color.bold(`${w.temperature}°C`)}`,
        `${label("Holat")}${w.condition}${w.poorVisibility ? color.yellow("  (ko'rinish yomon)") : ""}`,
        `${label("Yoritish")}${result.lighting}`,
        `${label("Transport")}${result.transport}`,
    ]));
}

async function buildDistrictAction() {
    const labels = ["Turar-joy  — LED chiroqlar, avtobus", "Biznes     — sensorli chiroqlar, taksi", "Sanoat     — kuchli chiroqlar, tramvay"];
    console.log(box("YANGI TUMAN (Builder)", [color.gray("Ma'lumotlarni bosqichma-bosqich kiriting")]));
    const builder = new DistrictBuilder();
    const name = await ask("Tuman nomi: ");
    if (city.hasDistrict(name)) throw new Error(`"${name}" tumani allaqachon mavjud`);
    builder.setName(name);
    builder.setFactory(createDistrictFactory(DISTRICT_TYPES[await pick("Tuman turi: ", labels)]));
    builder.setPopulation(await askNumber("Aholi soni: ", 1, 10_000_000));
    builder.addLights(await askNumber("Chiroqlar soni (0-50): ", 0, 50), (await ask("Ko'cha nomi: ")) || "Markaziy ko'cha");
    builder.addVehicles(await askNumber("Transport soni (0-20): ", 0, 20), (await ask("Yo'nalish: ")) || "Markaz");
    builder.addCameras(...(await ask("Kameralar joyi (vergul bilan): ")).split(","));
    builder.setEnergyLimit(await askNumber("Energiya limiti (kW): ", 1, 100_000));
    const district = builder.build();
    city.addDistrict(district);
    ok(`Qurildi: ${district.describe()}`);
}

function showModeResult(title: string, messages: string[]) {
    console.log(box(title, messages.map(m => `${color.green("✔")} ${m}`), city.isNightMode() ? color.magenta : color.yellow));
}

function showLog() {
    const levels = { INFO: color.cyan, WARN: color.yellow, ERROR: color.red };
    printList(Logger.getInstance().getLast(15).map(e =>
        `${color.gray(e.time)} ${levels[e.level](e.level.padEnd(5))} ${e.message}`), "Jurnal bo'sh");
}

function statusLine() {
    const report = city.getEnergyReport();
    return [
        `${label("Rejim")}${modeLabel()}`,
        `${label("Tumanlar")}${city.getDistricts().length} ta`,
        `${label("Energiya")}${bar(report.percent, 14)}`,
        `${label("Admin")}${onOff(city.getSecurity().isAuthenticated(), "kirgan", "kirmagan")}`,
    ];
}

async function main() {
    setupCity();
    console.log("\n" + box("S M A R T C I T Y", [
        color.bold("Aqlli shahar boshqaruv tizimi"),
        color.gray("Lab Work №1 · Artikov Rozimuhammadxon"),
    ], color.blue));
    try {
        await menu("BOSH MENYU", [
            ["Shahar holati", showCityReport],
            ["Transport boshqaruvi", transportMenu],
            ["Yoritish boshqaruvi", lightingMenu],
            ["Xavfsizlik tizimi", securityMenu],
            ["Energiya monitoringi", energyMenu],
            ["Ob-havo ma'lumotini yangilash", weatherAction],
            ["Yangi tuman qurish", buildDistrictAction],
            ["Tungi rejim", () => showModeResult("TUNGI REJIM", city.activateNightMode())],
            ["Kunduzgi rejim", () => showModeResult("KUNDUZGI REJIM", city.activateDayMode())],
            ["Tizim jurnali", showLog],
        ], "Chiqish", statusLine);
    } catch (error) {
        if (!(error instanceof ExitSignal)) throw error;
    }
    console.log("\n" + color.gray("  Dastur yakunlandi. Xayr!"));
    rl.close();
}

main();
