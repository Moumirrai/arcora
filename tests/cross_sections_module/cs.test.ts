import { describe, it, expect, beforeEach } from "vitest"; 
// Nezapomeň upravit importy podle toho, kde máš funkce a třídy uložené
import { 
    plochaPodVektorem, 
    tezistePlochyPodVektorem, 
    momentySetrvacnostiPodVektorem, 
    deviacniMomentPodVektorem,
    Polygon
} from "@arcora/cross_section_module/cs"; 
import { SpravceTeles } from "@arcora/cross_section_module/cs";
import type { ZadaniZatizeni } from "@arcora/cross_section_module/cs";

// --- NEZÁVISLÉ GEOMETRICKÉ FUNKCE ---

describe("Výpočty pod vektorem - plochaPodVektorem", () => {
    it("Vodorovná úsečka (čistý obdélník)", () => {
        const A = plochaPodVektorem(0, 4, 2, 2);
        expect(A).toBe(8); 
    });

    it("Šikmá úsečka z počátku (čistý trojúhelník)", () => {
        const A = plochaPodVektorem(0, 4, 0, 2);
        expect(A).toBe(4); 
    });

    it("Klasický lichoběžník v 1. kvadrantu", () => {
        const A = plochaPodVektorem(1, 5, 2, 6);
        expect(A).toBe(16); 
    });

    it("Vektor se zápornými souřadnicemi", () => {
        const A = plochaPodVektorem(-2, -6, -1, -3);
        expect(A).toBe(8); 
    });

    it("Svislá úsečka (nulová šířka)", () => {
        const A = plochaPodVektorem(3, 3, 1, 5);
        expect(A).toBe(0); 
    });

    it("Úsečka napříč kvadranty", () => {
        const A = plochaPodVektorem(5, -4, 6, -3);
        expect(A).toBe(67.5); 
    });
});

describe("Výpočty těžiště - tezistePlochyPodVektorem", () => {
    it("Vodorovná úsečka (obdélník) - Těžiště je přesně uprostřed", () => {
        const [Xt, Yt] = tezistePlochyPodVektorem(0, 4, 2, 2);
        expect(Xt).toBeCloseTo(2); 
        expect(Yt).toBeCloseTo(1); 
    });

    it("Šikmá úsečka z počátku (trojúhelník) - Těžiště ve 2/3 a 1/3", () => {
        const [Xt, Yt] = tezistePlochyPodVektorem(0, 4, 0, 2);
        expect(Xt).toBeCloseTo(2.6666666667, 5); 
        expect(Yt).toBeCloseTo(0.6666666667, 5); 
    });

    it("Opačně orientovaný trojúhelník (klesající)", () => {
        const [Xt, Yt] = tezistePlochyPodVektorem(0, 4, 2, 0);
        expect(Xt).toBeCloseTo(1.3333333333, 5); 
        expect(Yt).toBeCloseTo(0.6666666667, 5);
    });

    it("Úsečka tvořící 0 plochu (svislá) - Ošetření dělení nulou", () => {
        const [Xt, Yt] = tezistePlochyPodVektorem(3, 3, 1, 5);
        expect(Xt).toBeCloseTo(0); 
        expect(Yt).toBeCloseTo(0); 
    });
});

describe("Výpočty momentů setrvačnosti - momentySetrvacnostiPodVektorem", () => {
    it("Vodorovná úsečka (obdélník) k VLASTNÍMU těžišti", () => {
        const [Ix, Iy] = momentySetrvacnostiPodVektorem(0, 4, 2, 2, 2, 1);
        expect(Ix).toBeCloseTo(2.6666666667, 5); 
        expect(Iy).toBeCloseTo(10.6666666667, 5);
    });

    it("Vodorovná úsečka (obdélník) k POČÁTKU (0,0) - Steinerova věta", () => {
        const [Ix, Iy] = momentySetrvacnostiPodVektorem(0, 4, 2, 2, 0, 0);
        expect(Ix).toBeCloseTo(10.6666666667, 5); 
        expect(Iy).toBeCloseTo(42.6666666667, 5);
    });

    it("Šikmá úsečka (trojúhelník) k VLASTNÍMU těžišti", () => {
        const [Ix, Iy] = momentySetrvacnostiPodVektorem(0, 3, 0, 3, 2, 1);
        expect(Ix).toBeCloseTo(2.25, 5);
        expect(Iy).toBeCloseTo(2.25, 5);
    });
});

describe("Výpočet deviačního momentu - deviacniMomentPodVektorem", () => {
    it("Vodorovná úsečka (obdélník) k VLASTNÍMU těžišti", () => {
        const Dxy = deviacniMomentPodVektorem(0, 4, 2, 2, 2, 1);
        expect(Dxy).toBeCloseTo(0, 5);
    });

    it("Vodorovná úsečka (obdélník) k POČÁTKU (0,0) - Steinerova věta", () => {
        const Dxy = deviacniMomentPodVektorem(0, 4, 2, 2, 0, 0);
        expect(Dxy).toBeCloseTo(16, 5);
    });

    it("Šikmá úsečka (trojúhelník) s těžištěm na okraji (test zlomku 1/3 a 2/3)", () => {
        const Dxy = deviacniMomentPodVektorem(0, 3, 0, 3, 0, 0);
        expect(Dxy).toBeCloseTo(10.125, 5);
    });
});

// --- KOMPLEXNÍ OBJEKTOVÉ TESTY ---

describe("Komplexní testování třídy - SpravceTeles", () => {
    let spravce: SpravceTeles;

    beforeEach(() => {
        spravce = new SpravceTeles();
    });

    it("Normální polygon: Obdélník 4x2 v počátku (Přičítání +)", () => {
        const p1 = new Polygon([0, 4, 4, 0], [0, 0, 2, 2], true, 1.0, 210);
        spravce.polygony.push(p1);

        const vysledky = p1.vysledky!;

        expect(vysledky.plocha).toBeCloseTo(8, 5);
        expect(vysledky.teziste.x).toBeCloseTo(2, 5);
        expect(vysledky.teziste.y).toBeCloseTo(1, 5);
        expect(vysledky.moment_setrvacnosti[0]).toBeCloseTo(2.6666666667, 5);
        expect(vysledky.moment_setrvacnosti[1]).toBeCloseTo(10.6666666667, 5);
        expect(vysledky.deviacni_moment).toBeCloseTo(0, 5);
        expect(vysledky.hmotnost).toBeCloseTo(0.000008, 7);
    });

    it("Rizikový polygon 1: Pravoúhlý trojúhelník kompletně v záporných souřadnicích (+)", () => {
        const p1 = new Polygon([-3, 0, 0], [-3, -3, 0], true, 2.0, 210);
        spravce.polygony.push(p1);

        const vysledky = p1.vysledky!;

        expect(vysledky.plocha).toBeCloseTo(4.5, 5);
        expect(vysledky.teziste.x).toBeCloseTo(-1, 5);
        expect(vysledky.teziste.y).toBeCloseTo(-2, 5);
        expect(vysledky.moment_setrvacnosti[0]).toBeCloseTo(2.25, 5);
        expect(vysledky.moment_setrvacnosti[1]).toBeCloseTo(2.25, 5);
        expect(vysledky.deviacni_moment).toBeCloseTo(1.125, 5);
        expect(vysledky.hmotnost).toBeCloseTo(0.000009, 7);
    });

    it("Rizikový polygon 2: Body zadané v opačném směru (proti směru hodinových ručiček)", () => {
        const p1 = new Polygon([0, 0, 4, 4], [0, 2, 2, 0], true, 1.0, 210);
        spravce.polygony.push(p1);
        
        const vysledky = p1.vysledky!;

        expect(vysledky.plocha).toBeCloseTo(8, 5);
        expect(vysledky.teziste.x).toBeCloseTo(2, 5);
        expect(vysledky.teziste.y).toBeCloseTo(1, 5);
        expect(vysledky.moment_setrvacnosti[0]).toBeCloseTo(2.6666666667, 5);
        expect(vysledky.moment_setrvacnosti[1]).toBeCloseTo(10.6666666667, 5);
        expect(vysledky.deviacni_moment).toBeCloseTo(0, 5);
        expect(vysledky.hmotnost).toBeCloseTo(0.000008, 7);
    });

    it("Odčítaný polygon: Menší obdélník (DÍRA) funguje jako odečet (-)", () => {
        const p1 = new Polygon([1, 3, 3, 1], [1, 1, 2, 2], false, 1.0, 210);
        spravce.polygony.push(p1);

        const vysledky = p1.vysledky!;

        expect(vysledky.plocha).toBeCloseTo(-2, 5);
        expect(vysledky.teziste.x).toBeCloseTo(2, 5);
        expect(vysledky.teziste.y).toBeCloseTo(1.5, 5);
        expect(vysledky.moment_setrvacnosti[0]).toBeCloseTo(-0.1666666667, 5);
        expect(vysledky.moment_setrvacnosti[1]).toBeCloseTo(-0.6666666667, 5);
        expect(vysledky.hmotnost).toBeCloseTo(-0.000002, 7);
    });

    it("Velký náhodný polygon přes všechny kvadranty (Přičítání +)", () => {
        const p1 = new Polygon([-50, -20, -85, -30, -40, 0, 60, -20, 70, 110, 20, 30, -20, -100, -100, -80], [12, 20, 39, 100, 50, 120, 100, 50, 40, -30, 20, -50, -60, -30, 10, -20], true, 1.0, 210);
        spravce.polygony.push(p1);

        expect(spravce.polygony.length).toBe(1);
        const vysledky = p1.vysledky!;

        expect(vysledky.plocha).toBeCloseTo(16315, 2);
        expect(vysledky.teziste.x).toBeCloseTo(-6.68, 2);
        expect(vysledky.teziste.y).toBeCloseTo(18.74, 2);
        expect(vysledky.moment_setrvacnosti[0]).toBeCloseTo(31747859.71, 2);
        expect(vysledky.moment_setrvacnosti[1]).toBeCloseTo(29943223.95, 2);
        expect(vysledky.deviacni_moment).toBeCloseTo(4728673.49, 2);
        expect(vysledky.hmotnost).toBeCloseTo(0.02, 2);
    });

    it("Polygon zadáván v protisměru hodinových ručiček (Přičítání +)", () => {
        const p1 = new Polygon([40, 60, -50, -40], [20, 40, 80, -20], true, 1.0, 210);
        spravce.polygony.push(p1);

        expect(spravce.polygony.length).toBe(1);
        const vysledky = p1.vysledky!;

        expect(vysledky.plocha).toBeCloseTo(5700, 2);
        expect(vysledky.teziste.x).toBeCloseTo(-7.89, 2);
        expect(vysledky.teziste.y).toBeCloseTo(31.93, 2);
        expect(vysledky.moment_setrvacnosti[0]).toBeCloseTo(2448771.93, 2);
        expect(vysledky.moment_setrvacnosti[1]).toBeCloseTo(3789736.84, 2);
        expect(vysledky.deviacni_moment).toBeCloseTo(-28157.89, 2);
        expect(vysledky.hmotnost).toBeCloseTo(0.01, 2);
    });
});

describe("Testování průsečíků - aktualizujPruseciky", () => {
    let spravce: SpravceTeles;

    beforeEach(() => {
        spravce = new SpravceTeles();
    });

    it("Průsečíky dvou překrývajících se obdélníků (svislé a klasické čáry)", () => {
        const p1 = new Polygon([0, 6, 6, 0], [2, 2, 4, 4], true, 1.0, 210);
        const p2 = new Polygon([2, 4, 4, 2], [0, 0, 6, 6], true, 1.0, 210);
        spravce.polygony.push(p1, p2);

        // V nové architektuře je nutné po zadání polygonů aktualizovat průsečíky manuálně
        spravce.aktualizujPruseciky();
        
        expect(spravce.pruseciky.length).toBe(8);

        const obsahujeBod = (hledaneX: number, hledaneY: number) => {
            return spravce.pruseciky.some(
                p => Math.abs(p.x - hledaneX) < 1e-5 && Math.abs(p.y - hledaneY) < 1e-5
            );
        };

        expect(obsahujeBod(2, 2)).toBe(true);
        expect(obsahujeBod(4, 2)).toBe(true);
        expect(obsahujeBod(2, 4)).toBe(true);
        expect(obsahujeBod(4, 4)).toBe(true);
        expect(obsahujeBod(0, 0)).toBe(true);
        expect(obsahujeBod(6, 0)).toBe(true);
        expect(obsahujeBod(0, 6)).toBe(true);
        expect(obsahujeBod(6, 6)).toBe(true);
    });

    it("Průsečíky klasických šikmých přímek", () => {
        const p1 = new Polygon([0, 4, 0], [0, 4, 4], true, 1.0, 210);
        const p2 = new Polygon([0, 4, 4], [4, 0, 4], true, 1.0, 210);
        spravce.polygony.push(p1, p2);

        spravce.aktualizujPruseciky();

        const obsahujeBod = (hledaneX: number, hledaneY: number) => {
            return spravce.pruseciky.some(
                p => Math.abs(p.x - hledaneX) < 1e-5 && Math.abs(p.y - hledaneY) < 1e-5
            );
        };

        expect(obsahujeBod(2, 2)).toBe(true);
        expect(obsahujeBod(4, 4)).toBe(true);
        expect(obsahujeBod(0, 4)).toBe(true);
    });
});




// --------------------------- PRŮŘEZY ------------------------------




describe("Celkové charakteristiky průřezu - spocitejCelkove", () => {
    let spravce: SpravceTeles;

    beforeEach(() => {
        spravce = new SpravceTeles();
    });

    it("1. Homogenní symetrický průřez (Obdélník 4x2)", () => {
        const p1 = new Polygon([0, 4, 4, 0], [0, 0, 2, 2], true, 1.0, 210);
        spravce.polygony.push(p1);
        const vysledky = spravce.spocitejCelkove();

        expect(vysledky.celkova_vyska_h).toBeCloseTo(2, 5);
        expect(vysledky.celkova_sirka_b).toBeCloseTo(4, 5);
        expect(vysledky.vysledna_plocha).toBeCloseTo(8, 5);
        expect(vysledky.celkova_hmotnost).toBeCloseTo(0, 2);
        expect(vysledky.teziste_x).toBeCloseTo(2, 5);
        expect(vysledky.teziste_y).toBeCloseTo(1, 5);
        expect(vysledky.vysledny_moment_x).toBeCloseTo(2.6666666667, 5);
        expect(vysledky.vysledny_moment_y).toBeCloseTo(10.6666666667, 5);
        expect(vysledky.vysledny_dev_moment).toBeCloseTo(0, 5);
        expect(vysledky.i_x).toBeCloseTo(0.58, 2);
        expect(vysledky.i_y).toBeCloseTo(1.15, 2);
        expect(vysledky.W_x_h).toBeCloseTo(2.67, 2);
        expect(vysledky.W_x_d).toBeCloseTo(2.67, 2);
        expect(vysledky.W_y_p).toBeCloseTo(5.33, 2);
        expect(vysledky.W_y_l).toBeCloseTo(5.33, 2);
        expect(vysledky.alfa_deg).toBeCloseTo(90, 5);
        expect(vysledky.vysledny_moment_max).toBeCloseTo(10.6666666667, 5); 
        expect(vysledky.vysledny_moment_min).toBeCloseTo(2.6666666667, 5);
        expect(vysledky.i_max).toBeCloseTo(1.15, 2);
        expect(vysledky.i_min).toBeCloseTo(0.58, 2);
        expect(vysledky.W_max_h).toBeCloseTo(5.33, 2);
        expect(vysledky.W_max_d).toBeCloseTo(5.33, 2);
        expect(vysledky.W_min_p).toBeCloseTo(2.67, 2);
        expect(vysledky.W_min_l).toBeCloseTo(2.67, 2);  
    });

    it("2. Nehomogenní průřez (Dva materiály s různým E)", () => {
        const p1 = new Polygon([0, 40, 40, 0], [0, 0, 20, 20], true, 7850, 210);
        const p2 = new Polygon([0, 40, 40, 0], [20, 20, 40, 40], true, 2800, 50);
        spravce.polygony.push(p1, p2);

        spravce.zvolene_E_ref = 210;
        const vysledky = spravce.spocitejCelkove();

        expect(vysledky.celkova_vyska_h).toBeCloseTo(40, 5);
        expect(vysledky.celkova_sirka_b).toBeCloseTo(40, 5);
        expect(vysledky.vysledna_plocha).toBeCloseTo(1600, 5);
        expect(vysledky.celkova_hmotnost).toBeCloseTo(8.52, 2);
        expect(vysledky.teziste_x).toBeCloseTo(20, 5);
        expect(vysledky.teziste_y).toBeCloseTo(13.85, 2);
        expect(vysledky.vysledny_moment_x).toBeCloseTo(94554.33, 2);
        expect(vysledky.vysledny_moment_y).toBeCloseTo(132063.49, 2);
        expect(vysledky.vysledny_dev_moment).toBeCloseTo(0, 5);
        expect(vysledky.i_x).toBeCloseTo(9.77, 2);
        expect(vysledky.i_y).toBeCloseTo(11.55, 2);
        expect(vysledky.W_x_h).toBeCloseTo(3615.31, 2);
        expect(vysledky.W_x_d).toBeCloseTo(6828.92, 2);
        expect(vysledky.W_y_p).toBeCloseTo(6603.17, 2);
        expect(vysledky.W_y_l).toBeCloseTo(6603.17, 2);
        expect(vysledky.alfa_deg).toBeCloseTo(90, 5);
        expect(vysledky.vysledny_moment_max).toBeCloseTo(132063.49, 2); 
        expect(vysledky.vysledny_moment_min).toBeCloseTo(94554.33, 2);
        expect(vysledky.i_max).toBeCloseTo(11.55, 2);
        expect(vysledky.i_min).toBeCloseTo(9.77, 2);
        expect(vysledky.W_max_h).toBeCloseTo(6603.17, 2);
        expect(vysledky.W_max_d).toBeCloseTo(6603.17, 2);
        expect(vysledky.W_min_p).toBeCloseTo(6828.92, 2);
        expect(vysledky.W_min_l).toBeCloseTo(3615.31, 2);  
    });

    it("3. Průřez s otvorem (Odečítání polygonu)", () => {
        const p1 = new Polygon([0, 40, 40, 0], [0, 0, 40, 40], true, 1.0, 210);
        const p2 = new Polygon([10, 30, 30, 10], [10, 10, 30, 30], false, 1.0, 210);
        spravce.polygony.push(p1, p2);

        const vysledky = spravce.spocitejCelkove();

        expect(vysledky.celkova_vyska_h).toBeCloseTo(40, 5);
        expect(vysledky.celkova_sirka_b).toBeCloseTo(40, 5);
        expect(vysledky.vysledna_plocha).toBeCloseTo(1200, 5);
        expect(vysledky.celkova_hmotnost).toBeCloseTo(0, 2);
        expect(vysledky.teziste_x).toBeCloseTo(20, 5);
        expect(vysledky.teziste_y).toBeCloseTo(20, 5);
        expect(vysledky.vysledny_moment_x).toBeCloseTo(200000, 2);
        expect(vysledky.vysledny_moment_y).toBeCloseTo(200000, 2);
        expect(vysledky.vysledny_dev_moment).toBeCloseTo(0, 5);
        expect(vysledky.i_x).toBeCloseTo(12.91, 2);
        expect(vysledky.i_y).toBeCloseTo(12.91, 2);
        expect(vysledky.W_x_h).toBeCloseTo(10000, 2);
        expect(vysledky.W_x_d).toBeCloseTo(10000, 2);
        expect(vysledky.W_y_p).toBeCloseTo(10000, 2);
        expect(vysledky.W_y_l).toBeCloseTo(10000, 2);
        expect(vysledky.alfa_deg).toBeCloseTo(0, 5);
        expect(vysledky.vysledny_moment_max).toBeCloseTo(200000, 2); 
        expect(vysledky.vysledny_moment_min).toBeCloseTo(200000, 2);
        expect(vysledky.i_max).toBeCloseTo(12.91, 2);
        expect(vysledky.i_min).toBeCloseTo(12.91, 2);
        expect(vysledky.W_max_h).toBeCloseTo(10000, 2);
        expect(vysledky.W_max_d).toBeCloseTo(10000, 2);
        expect(vysledky.W_min_p).toBeCloseTo(10000, 2);
        expect(vysledky.W_min_l).toBeCloseTo(10000, 2);  
    });
    
    it("4. Kontrola pádu při prázdném zadání", () => {
        expect(() => spravce.spocitejCelkove()).toThrowError("Nejdříve zadejte alespoň jeden platný polygon.");
    });
});

// zkusit random průřezy napříč kvadrantama a zadavaný proti směru hodinových ručiček (u toho checknout deviační moment)



describe("Výpočet průběhu napětí - spocitejRovniceNapeti", () => {
    let spravce: SpravceTeles;

    beforeEach(() => {
        spravce = new SpravceTeles();
        // Pro všechny testy vytvoříme stejný základní obdélník 4x2 v počátku
        // Těžiště je v bodě [2, 1], Plocha = 8
        const p1 = new Polygon([0, 4, 4, 0], [0, 0, 2, 2], true, 1.0, 210);
        spravce.polygony.push(p1);
    });

    it("1. Čistý centrický tlak (Bodové zatížení v těžišti)", () => {
        // Síla 8000 N působí přesně v těžišti [2, 1]
        // Nezpůsobuje žádný ohyb (Mx=0, My=0). 
        // Napětí musí být konstantní po celém průřezu: sigma = N / A = 8000 / 8 = 1000
        // Rovnice roviny: z = 0x + 0y + 1000
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 8000,
            x_val: [2],
            y_val: [1]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        
        expect(vysledky.length).toBe(1);
        const rovina = vysledky[0]!;

        expect(rovina.a).toBeCloseTo(0, 4);    // x-ová složka sklonu
        expect(rovina.b).toBeCloseTo(0, 4);    // y-ová složka sklonu
        expect(rovina.c).toBeCloseTo(1000000000, 4); // posun (konstanta)
    });

    it("2. Rovnoměrné plošné zatížení (Konstantní tlak)", () => {
        // Plošné zatížení 1000 N/m² nanesené přesně na náš polygon 4x2
        // Náhradní síla: 1000 * 8 = 8000 N, působí v těžišti [2, 1]
        // Výsledek musí být identický jako u centrického tlaku: z = 0x + 0y + 1000
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 1000,
            x_val: [0, 4, 4, 0],
            y_val: [0, 0, 2, 2]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        const rovina = vysledky[0]!;

        expect(rovina.a).toBeCloseTo(0, 4);
        expect(rovina.b).toBeCloseTo(0, 4);
        expect(rovina.c).toBeCloseTo(1000, 4);
    });

    it("3. Excentrický tlak (Ohyb kolem osy X)", () => {
        // Síla 8000 N posunutá na horní hranu obdélníku do bodu [2, 2]
        // Excentricita ey = +1 m (posun od těžiště [2,1] směrem nahoru)
        // Vyvolá ohybový moment Mx = 8000 * 1 = 8000 Nm
        // Podle Navierovy rovnice vyjde rovina: z = 0x + 3000y - 2000
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 8000,
            x_val: [2],
            y_val: [2]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        const rovina = vysledky[0]!;

        // Očekáváme z = 0x + 3000y - 2000
        expect(rovina.a).toBeCloseTo(0, 4);
        expect(rovina.b).toBeCloseTo(3000000000, 4);
        expect(rovina.c).toBeCloseTo(-2000000000, 4);
    });

    it("4. Liniové zatížení po spodní hraně (Excentricita v ose Y)", () => {
        // Liniové zatížení 2000 N/m po délce 4 m (spodní hrana X: 0->4, Y: 0)
        // Náhradní síla F = 8000 N v těžišti linie [2, 0]
        // Excentricita ey = -1 m (posun dolů)
        // Vyvolá ohybový moment Mx = -8000 Nm
        // Rovina by měla být opačně nakloněná: z = 0x - 3000y + 4000
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 2000,
            x_val: [0, 4],
            y_val: [0, 0]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        const rovina = vysledky[0]!;

        expect(rovina.a).toBeCloseTo(0, 4);
        expect(rovina.b).toBeCloseTo(-3000000, 4);
        expect(rovina.c).toBeCloseTo(4000000, 4);
    });
});


describe("Nehomogenní průřezy (Kombinace odlišných materiálů)", () => {
    let spravce: SpravceTeles;

    beforeEach(() => {
        spravce = new SpravceTeles();
    });

    it("1. Sendvičový průřez (Dva materiály nad sebou) - Posun neutrální osy k tužšímu", () => {
        // Spodní část: Ocel (šířka 10, výška 2), E = 210 GPa, hustota 7850
        // Fyzická plocha = 20, lokální těžiště y = 1
        const ocel = new Polygon([0, 10, 10, 0], [0, 0, 2, 2], true, 7850, 210);
        
        // Horní část: Měkčí materiál (šířka 10, výška 8), E = 21 GPa (10x měkčí), hustota 500
        // Fyzická plocha = 80, lokální těžiště y = 6
        const drevo = new Polygon([0, 10, 10, 0], [2, 2, 10, 10], true, 500, 21);
        
        spravce.polygony.push(ocel, drevo);

        // Nastavení referenčního modulu pružnosti na ocel
        spravce.zvolene_E_ref = 210;
        const vysledky = spravce.spocitejCelkove();

        // Očekávané chování ideálního průřezu:
        // Fyzická plocha celkem je 100, ale ideální se přepočítá přes poměr E
        // A_id = 20*1 + 80*(21/210) = 20 + 8 = 28
        expect(vysledky.celkova_vyska_h).toBeCloseTo(10, 5);
        expect(vysledky.celkova_sirka_b).toBeCloseTo(10, 5);
        expect(vysledky.vysledna_plocha).toBeCloseTo(100, 5);

        // Těžiště by mělo být staženo dolů k tužšímu materiálu (oceli)
        // Y_t_id = (20 * 1 + 8 * 6) / 28 = (20 + 48) / 28 = 68 / 28 ≈ 2.42857
        expect(vysledky.teziste_x).toBeCloseTo(5, 5);
        expect(vysledky.teziste_y).toBeCloseTo(2.42857, 4);
    });

    it("2. Asymetrický průřez z různých materiálů (Vedle sebe) - Posun těžiště v ose X", () => {
        // Levá část: Tužší materiál (např. E=200 GPa)
        // Šířka 5, výška 10 -> Plocha = 50, lokální těžiště x = 2.5
        const levyTuhaCast = new Polygon([0, 5, 5, 0], [0, 0, 10, 10], true, 1.0, 200);
        
        // Pravá část: 4x měkčí materiál (E=50 GPa)
        // Šířka 5, výška 10 -> Plocha = 50, lokální těžiště x = 7.5
        const pravaMekciCast = new Polygon([5, 10, 10, 5], [0, 0, 10, 10], true, 1.0, 50);
        
        spravce.polygony.push(levyTuhaCast, pravaMekciCast);

        // Referenční E nastavíme na tužší materiál
        spravce.zvolene_E_ref = 200; 
        const vysledky = spravce.spocitejCelkove();

        // Výpočet ideální plochy:
        // A_id = 50 * (200/200) + 50 * (50/200) = 50 + 12.5 = 62.5
        expect(vysledky.vysledna_plocha).toBeCloseTo(100, 5);

        // Těžiště X se musí posunout doleva k tužšímu materiálu
        // X_t_id = (50 * 2.5 + 12.5 * 7.5) / 62.5 = (125 + 93.75) / 62.5 = 218.75 / 62.5 = 3.5
        expect(vysledky.teziste_x).toBeCloseTo(3.5, 5);
        
        // V ose Y jsou oba polygony stejné, těžiště musí zůstat přesně uprostřed
        expect(vysledky.teziste_y).toBeCloseTo(5, 5);
    });
});


describe("Výpočet napětí s odlišnými materiály (Rozdílné E) - spocitejRovniceNapeti", () => {
    let spravce: SpravceTeles;

    beforeEach(() => {
        spravce = new SpravceTeles();
        
        // Vytvoříme jednoduchý složený průřez, aby se dobře kontrolovaly hodnoty
        // Poly 1 (Dole): Tužší materiál (např. Ocel), E = 200 GPa
        // Šířka 10, výška 2 (y od 0 do 2). Fyzická plocha = 20. Těžiště y = 1.
        const p1 = new Polygon([0, 100, 100, 0], [0, 0, 20, 20], true, 1.0, 200);
        
        // Poly 2 (Nahoře): 2x měkčí materiál, E = 100 GPa
        // Šířka 10, výška 4 (y od 2 do 6). Fyzická plocha = 40. Těžiště y = 4.
        const p2 = new Polygon([0, 100, 100, 0], [20, 20, 60, 60], true, 1.0, 100);
        
        spravce.polygony.push(p1, p2);
        spravce.zvolene_E_ref = 200; // Referenční modul je tužší materiál

        // Nutné zavolat před výpočtem napětí, aby se určilo ideální těžiště a momenty
        // Očekávané ideální hodnoty interně:
        // A_id = 20*1 + 40*0.5 = 40
        // Těžiště Y_id = (20*1 + 20*4) / 40 = 2.5
        // Ix_id = 123.33333
        spravce.spocitejCelkove(); 
    });

    it("1. Čistý centrický tlak - Napětí se skokově mění podle tuhosti materiálu", () => {
        // Zatížení 40 000 N umístěné přesně v ideálním těžišti [5, 2.5]
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 40000,
            x_val: [50],
            y_val: [25]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        
        // Očekáváme, že funkce vrátí samostatnou rovnici roviny pro každý polygon
        expect(vysledky.length).toBe(2);
        const rovinaPoly1 = vysledky[0]!; // Tužší (E=200)
        const rovinaPoly2 = vysledky[1]!; // Měkčí (E=100)

        // Tužší materiál (přebírá plné napětí ideálního průřezu)
        // sigma_1 = (N / A_id) * (200/200) = (40000 / 40) * 1 = 1000
        expect(rovinaPoly1.a).toBeCloseTo(0, 4);
        expect(rovinaPoly1.b).toBeCloseTo(0, 4);
        expect(rovinaPoly1.c).toBeCloseTo(6666666.666667, 4);

        // Měkčí materiál (přebírá pouze polovinu napětí)
        // sigma_2 = (N / A_id) * (100/200) = (40000 / 40) * 0.5 = 500
        expect(rovinaPoly2.a).toBeCloseTo(0, 4);
        expect(rovinaPoly2.b).toBeCloseTo(0, 4);
        expect(rovinaPoly2.c).toBeCloseTo(3333333.333333, 4);
    });

    it("2. Excentrický tlak (Ohyb) - Rovina napětí má odlišný sklon pro každý materiál", () => {
        // Síla 40 000 N působí mimo těžiště v ose Y = 3.5 (excentricita ey = 1 m nahoru)
        // Vyvolá konstantní tlak + ohybový moment Mx = 40 000 Nm
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 40000,
            x_val: [50],
            y_val: [35]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        
        const rovinaPoly1 = vysledky[0]!; // Tužší (E=200)
        const rovinaPoly2 = vysledky[1]!; // Měkčí (E=100)

        // Analytický předpoklad pro IDEÁLNÍ průřez ze vzorce Navierovy hypotézy v globálních souřadnicích:
        // sigma_id(y) = 324.3243 * y + 189.1892
        
        // Poly 1 (E=200) - Odpovídá referenčnímu modulu, rovnice je 1:1 s ideálním průřezem
        expect(rovinaPoly1.a).toBeCloseTo(0, 4);
        expect(rovinaPoly1.b).toBeCloseTo(324324.324, 0); // sklon b
        expect(rovinaPoly1.c).toBeCloseTo(-1441441.441, 3); // konstanta c

        // Poly 2 (E=100) - Rovina napětí musí být poloviční (jak sklon, tak celkový posun)
        expect(rovinaPoly2.a).toBeCloseTo(0, 4);
        expect(rovinaPoly2.b).toBeCloseTo(162162.162, 3); // poloviční sklon (324.3243 / 2)
        expect(rovinaPoly2.c).toBeCloseTo(-720720.7207, 3);  // poloviční konstanta (189.1892 / 2)
    });

        it("3. Liniové zatížení", () => {
        // Síla 40 000 N působí mimo těžiště v ose Y = 3.5 (excentricita ey = 1 m nahoru)
        // Vyvolá konstantní tlak + ohybový moment Mx = 40 000 Nm
        const zatizeni: ZadaniZatizeni[] = [{
            hodnota: 2000,
            x_val: [25, 75],
            y_val: [25, 25]
        }];

        const vysledky = spravce.spocitejRovniceNapeti(zatizeni);
        
        const rovinaPoly1 = vysledky[0]!; // Tužší (E=200)
        const rovinaPoly2 = vysledky[1]!; // Měkčí (E=100)

        // Analytický předpoklad pro IDEÁLNÍ průřez ze vzorce Navierovy hypotézy v globálních souřadnicích:
        // sigma_id(y) = 324.3243 * y + 189.1892
        
        // Poly 1 (E=200) - Odpovídá referenčnímu modulu, rovnice je 1:1 s ideálním průřezem
        expect(rovinaPoly1.a).toBeCloseTo(0, 4);
        expect(rovinaPoly1.b).toBeCloseTo(0, 0); // sklon b
        expect(rovinaPoly1.c).toBeCloseTo(16666.6667, 3); // konstanta c

        // Poly 2 (E=100) - Rovina napětí musí být poloviční (jak sklon, tak celkový posun)
        expect(rovinaPoly2.a).toBeCloseTo(0, 4);
        expect(rovinaPoly2.b).toBeCloseTo(0, 3); // poloviční sklon (324.3243 / 2)
        expect(rovinaPoly2.c).toBeCloseTo(8333.3333, 3);  // poloviční konstanta (189.1892 / 2)
    });
});









