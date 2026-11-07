# SmartCity System — Design Patternlar hujjati

Muallif: Artikov Rozimuhammadxon

Bu hujjatda loyihada ishlatilgan **8 ta design pattern** tasvirlangan. Har biri uchun qaysi faylda joylashgani, qaysi muammoni yechishi, qanday ishlashi va qaysi test bilan tekshirilgani ko'rsatilgan.

| # | Pattern | Turi | Fayl |
|---|---------|------|------|
| 1 | Singleton | Creational | `src/core/controller/CityController.ts`, `src/utils/Logger.ts` |
| 2 | Facade | Structural | `src/core/controller/CityController.ts` |
| 3 | Factory Method | Creational | `src/core/factories/VehicleFactory.ts` |
| 4 | Abstract Factory | Creational | `src/core/factories/DistrictFactory.ts` |
| 5 | Builder | Creational | `src/core/builders/DistrictBuilder.ts` |
| 6 | Adapter | Structural | `src/core/adapters/WeatherAdapter.ts` |
| 7 | Proxy | Structural | `src/core/proxy/SecurityProxy.ts` |
| 8 | Decorator | Structural | `src/core/decorators/SmartLightDecorator.ts` |

---

## Umumiy arxitektura

```text
                         main.ts (konsol menyu)
                                │
                                ▼
              ┌────────── CityController ──────────┐   Singleton + Facade
              │                                     │
   ┌──────────┼──────────────┬──────────────┬──────┴──────┐
   ▼          ▼              ▼              ▼             ▼
Lighting   Transport    SecurityProxy    Energy     WeatherAdapter
 System     System           │           System           │
   ▲          ▲              ▼                            ▼
   │          │        SecuritySystem         ExternalWeatherService
   │          │
   └── DistrictBuilder ◄── DistrictFactory ──► VehicleFactory
          (Builder)      (Abstract Factory)    (Factory Method)
                                │
                                ▼
                       SmartLightDecorator
                          (Decorator)

                Logger (Singleton) — barcha qismlar foydalanadi
```

**Ish jarayoni:**
1. `main.ts` faqat `CityController` bilan ishlaydi.
2. Yangi tuman `DistrictBuilder` orqali quriladi. Builder chiroq va transportni `DistrictFactory` dan oladi.
3. `DistrictFactory` transportni `VehicleFactory` orqali yaratadi, chiroqlarni esa Decorator bilan o'raydi.
4. Ob-havo `WeatherAdapter` orqali keladi va yoritish hamda transport tezligini o'zgartiradi.
5. Xavfsizlik tizimiga foydalanuvchi faqat `SecurityProxy` orqali kiradi.
6. `EnergySystem` barcha subsistemalarning sarfini `ISubsystem` interfeysi orqali yig'adi. Limit oshsa, `Logger` ga ogohlantirish yozadi.

---

## 1. Singleton

**Fayllar:** `src/core/controller/CityController.ts`, `src/utils/Logger.ts`

**Muammo:** shaharning boshqaruv markazi va voqealar jurnali bitta bo'lishi kerak. Ular ikki marta yaratilsa, holat ikkiga bo'linib ketadi. Masalan, bir joyda tungi rejim yoqilgan bo'ladi, boshqa joyda esa yo'q.

**Yechim:** konstruktor `private` qilinadi. Obyekt faqat `getInstance()` orqali olinadi va u har doim bitta nusxani qaytaradi.

```ts
export class CityController {
    private static instance: CityController | null = null;

    private constructor() { ... }

    static getInstance(): CityController {
        if (!CityController.instance) CityController.instance = new CityController();
        return CityController.instance;
    }
}
```

**Tizimda:** `main.ts` va testlar `CityController.getInstance()` ni chaqiradi. Barcha klasslar jurnalga `Logger.getInstance().info(...)` orqali yozadi va "Tizim jurnali" menyusida hammasi bitta joyda ko'rinadi.

**Test:** `tests/singleton.test.ts` — bir xil obyekt qaytishi, holatning umumiyligi, `resetInstance()` va Logger yozuvlarining umumiyligi tekshiriladi.

---

## 2. Facade

**Fayl:** `src/core/controller/CityController.ts`

**Muammo:** shaharda 5 ta subsistema bor: yoritish, transport, xavfsizlik, energiya va ob-havo. Menyu ularning har biri bilan alohida ishlasa, kod chigallashadi. "Tungi rejim" kabi amallar esa bir nechta subsistemani birga boshqarishni talab qiladi.

**Yechim:** `CityController` barcha subsistemalarni ichida saqlaydi va tashqariga oddiy metodlarni beradi.

```ts
activateNightMode() {
    this.nightMode = true;
    this.lighting.turnAllOn();
    this.lighting.setBrightnessAll(this.currentBrightness());
    this.security.arm();
    this.checkEnergy();
    ...
}
```

**Tizimda:** bitta chaqiruv bir nechta subsistemani boshqaradi:
- `activateNightMode()` / `activateDayMode()` — yoritish, xavfsizlik va energiya;
- `updateWeather()` — ob-havo, yoritish va transport;
- `addDistrict()` — tumanning chiroq, transport va kameralarini kerakli subsistemalarga ulaydi, energiya limitini oshiradi;
- `setEnergySaving()` — energiya va yoritish.

**Test:** `tests/facade.test.ts` — tuman qo'shish, tungi va kunduzgi rejim, tejash rejimi, ob-havo, transport va hisobot tekshiriladi.

---

## 3. Factory Method

**Fayl:** `src/core/factories/VehicleFactory.ts`

**Muammo:** transportning bir nechta turi bor: avtobus, tramvay va taksi. Har birini yaratishda bir xil ishlar takrorlanadi: ID berish va jurnalga yozish. Yaratiladigan klass esa har xil.

**Yechim:** umumiy mantiq `deploy()` metodida, abstrakt klassda yoziladi. Qaysi obyekt yaratilishini esa voris klass `createVehicle()` (factory method) orqali hal qiladi.

```ts
export abstract class VehicleFactory {
    protected abstract createVehicle(id: string, route: string): IVehicle;

    deploy(route: string): IVehicle {
        const vehicle = this.createVehicle(`${prefix}-${next}`, route);
        Logger.getInstance().info(`Yangi transport: ${vehicle.describe()}`);
        return vehicle;
    }
}

export class BusFactory extends VehicleFactory {
    protected createVehicle(id: string, route: string) { return new Bus(id, route); }
}
```

**Tizimda:** `TransportSystem.dispatch(factory, route)` qaysi fabrika kelganini bilmaydi, faqat `deploy()` ni chaqiradi. Yangi transport turini qo'shish uchun bitta klass va bitta fabrika yozish kifoya.

**Test:** `tests/factory-method.test.ts` — to'g'ri tur yaratilishi, ID ketma-ketligi, nom bo'yicha tanlash va noma'lum tur uchun xato tekshiriladi.

---

## 4. Abstract Factory

**Fayl:** `src/core/factories/DistrictFactory.ts`

**Muammo:** har xil turdagi tumanga mos jihozlar to'plami kerak. Turar-joy tumaniga tejamkor chiroq va avtobus mos keladi, sanoat tumaniga esa kuchli chiroq va tramvay. Bu jihozlar aralashib ketmasligi kerak.

**Yechim:** `DistrictFactory` interfeysi bir oila mahsulotlarini yaratadi: chiroq va transport. Har bir tuman turi uchun alohida fabrika bor.

```ts
export interface DistrictFactory {
    getDistrictType(): string;
    createLight(id: string, location: string): ILight;
    createVehicle(route: string): IVehicle;
}
```

| Fabrika | Chiroq | Transport |
|---------|--------|-----------|
| `ResidentialDistrictFactory` | LED tejamkor, 100 W | Avtobus |
| `BusinessDistrictFactory` | Harakat sensorli, 150 W | Taksi |
| `IndustrialDistrictFactory` | Oddiy kuchli, 250 W | Tramvay |

**Tizimda:** `DistrictBuilder` qaysi fabrika berilganini bilmaydi. U faqat `createLight()` va `createVehicle()` ni chaqiradi, shuning uchun bitta tuman ichidagi barcha jihozlar bir oiladan bo'ladi.

**Test:** `tests/abstract-factory.test.ts` — har bir oila mahsulotlari, energiya sarfidagi farq va nom bo'yicha tanlash tekshiriladi.

---

## 5. Builder

**Fayl:** `src/core/builders/DistrictBuilder.ts` (mahsulot: `src/models/District.ts`)

**Muammo:** tumanning qismlari ko'p: nom, tur, aholi soni, chiroqlar, transport, kameralar va energiya limiti. Ularning bir qismi ixtiyoriy. Shuncha parametrli konstruktor bilan ishlash noqulay va xatoga olib keladi.

**Yechim:** tuman bosqichma-bosqich quriladi. Har bir metod builderning o'zini qaytaradi, `build()` esa tayyor obyektni tekshirib qaytaradi.

```ts
const district = new DistrictBuilder()
    .setName("Chilonzor")
    .setFactory(createDistrictFactory("residential"))
    .setPopulation(270000)
    .addLights(6, "Bunyodkor shoh ko'chasi")
    .addVehicles(3, "Chilonzor - Markaz")
    .addCameras("Chilonzor metro bekati", "Chorsu bozori")
    .setEnergyLimit(250)
    .build();
```

**Tizimda:** dastur ishga tushganda 3 ta tuman shu builder orqali quriladi. "Yangi tuman qurish" menyusida foydalanuvchi ham tumanni qadam-baqadam yig'adi. `build()` nom, fabrika va aholi sonini tekshiradi, keyin builderni tozalaydi.

**Test:** `tests/builder.test.ts` — to'liq qurish, zanjir chaqiruv, validatsiya xatolari va `build()` dan keyin tozalanish tekshiriladi.

---

## 6. Adapter

**Fayllar:** `src/core/adapters/WeatherAdapter.ts`, `src/core/adapters/external/ExternalWeatherService.ts`

**Muammo:** tashqi ob-havo xizmati ma'lumotni tizimga mos bo'lmagan formatda beradi: JSON matn, Farengeyt, `CLR`/`RA`/`FG` kabi kodlar va metrdagi ko'rinish masofasi. Tizim esa `IWeatherProvider` interfeysini kutadi. Tashqi klassni o'zgartirib bo'lmaydi.

**Yechim:** `WeatherAdapter` tizim interfeysini amalga oshiradi, ichida esa tashqi xizmatni chaqirib, ma'lumotni o'giradi.

```ts
export class WeatherAdapter implements IWeatherProvider {
    getWeather(city: string): WeatherInfo {
        const raw = JSON.parse(this.service.fetchRawData(CITY_STATIONS[name]));
        return {
            city: name,
            temperature: Math.round(((raw.temp_f - 32) * 5) / 9),
            condition: SKY_CONDITIONS[raw.sky_code] ?? "Noma'lum",
            poorVisibility: raw.visibility_m < 1000,
            precipitation: raw.sky_code === "RA" || raw.sky_code === "SN",
        };
    }
}
```

| Tashqi xizmat beradi | Adapter qaytaradi |
|----------------------|-------------------|
| `"TAS"` stansiya kodi | `"Toshkent"` |
| `temp_f: 86` | `temperature: 30` (°C) |
| `sky_code: "FG"` | `condition: "Tuman"` |
| `visibility_m: 400` | `poorVisibility: true` |

**Tizimda:** "Ob-havo ma'lumotini yangilash" menyusi. Ko'rinish yomon bo'lsa, chiroqlar 100% yoqiladi va tezlik chegarasi 30 km/soat bo'ladi. Yomg'ir yoki qorda chiroqlar 80% ga, tezlik 40 km/soat ga o'rnatiladi.

**Test:** `tests/adapter.test.ts` — harorat o'girilishi, kodlar tarjimasi, ko'rinish va yog'ingarchilik, noma'lum shahar va tizim ichida ishlatilishi tekshiriladi.

---

## 7. Proxy

**Fayl:** `src/core/proxy/SecurityProxy.ts` (haqiqiy obyekt: `src/modules/security/SecuritySystem.ts`)

**Muammo:** xavfsizlik tizimini yoqish, o'chirish yoki kameralarni ko'rish amallarini hamma bajara olmasligi kerak. Lekin `SecuritySystem` klassi o'zi parol tekshirmaydi.

**Yechim:** `SecurityProxy` xuddi shu `ISecuritySystem` interfeysini amalga oshiradi. Har bir chaqiruvni haqiqiy tizimga uzatishdan oldin ruxsatni tekshiradi.

```ts
arm() {
    this.authorize("Tizimni yoqish");
    this.real.arm();
}

private authorize(action: string) {
    if (!this.authenticated) {
        this.record(`RAD ETILDI: ${action}`);
        throw new AccessDeniedError(action);
    }
    this.record(`Ruxsat berildi: ${action}`);
}
```

| Amal | Ruxsat |
|------|--------|
| Holat, `isArmed()`, signal berish | Hamma uchun ochiq |
| Yoqish, o'chirish, kameralar, hodisalar | Faqat admin (parol: `admin123`) |

**Tizimda:** `CityController.getSecurity()` foydalanuvchiga haqiqiy tizimni emas, proxy'ni beradi. Kirish urinishlari, jumladan rad etilganlari ham, "Kirish jurnali" ga yoziladi.

**Test:** `tests/proxy.test.ts` — parolsiz bloklanish, noto'g'ri parol, to'g'ri parol, logout, ochiq amallar va kirish jurnali tekshiriladi.

---

## 8. Decorator

**Fayl:** `src/core/decorators/SmartLightDecorator.ts`

**Muammo:** ko'cha chiroqlariga yangi "aqlli" funksiyalar qo'shish kerak: harakat sensori va LED tejamkorlik. Har bir kombinatsiya uchun alohida klass yozilsa, klasslar soni tez ko'payadi: `MotionLight`, `EcoLight`, `MotionEcoLight` va hokazo.

**Yechim:** decorator chiroqni o'rab oladi va xuddi shu `ILight` interfeysini amalga oshiradi. Barcha chaqiruvlarni ichki chiroqqa uzatadi, faqat kerakli xatti-harakatni o'zgartiradi. Decoratorlarni ustma-ust qo'yish mumkin.

```ts
export class MotionSensorLight extends SmartLightDecorator {
    protected getFeatureName() { return "harakat sensori"; }
    getPowerUsage() { return this.light.getPowerUsage() * 0.6; }
}

const light = new EnergySavingLight(new MotionSensorLight(new StreetLight("L1", "Ko'cha", 100)));
light.getPowerUsage(); // 100 W → 60 W → 30 W
```

| Decorator | Ta'siri |
|-----------|---------|
| `MotionSensorLight` | Energiya sarfi −40% |
| `EnergySavingLight` | Energiya sarfi −50% |

**Tizimda:** `DistrictFactory` turar-joy va biznes tumanlari uchun chiroqlarni decorator bilan yaratadi. "Yoritish → Chiroqni yangilash" menyusida foydalanuvchi istalgan chiroqqa ish vaqtida funksiya qo'sha oladi. Bir xil funksiyani ikki marta qo'shib bo'lmaydi.

**Test:** `tests/decorator.test.ts` — energiya kamayishi, ustma-ust qo'llash, asosiy obyekt o'zgarmasligi, buyruqlarning uzatilishi va takroriy yangilash tekshiriladi.

---

## Testlar natijasi

```text
npm test

ℹ tests 60
ℹ pass 60
ℹ fail 0
```

| Test fayli | Pattern | Testlar soni |
|------------|---------|--------------|
| `singleton.test.ts` | Singleton | 6 |
| `facade.test.ts` | Facade | 11 |
| `factory-method.test.ts` | Factory Method | 6 |
| `abstract-factory.test.ts` | Abstract Factory | 6 |
| `builder.test.ts` | Builder | 8 |
| `adapter.test.ts` | Adapter | 8 |
| `proxy.test.ts` | Proxy | 8 |
| `decorator.test.ts` | Decorator | 7 |
| **Jami** | | **60** |
