import { describe, it, expect, beforeEach } from "vitest"; 
// Nezapomeň upravit import podle toho, kde máš výpočetní funkci uloženou
import { plochaPodVektorem } from "@arcora/cross_section_module/cs"; 
import { SpravceTeles } from "@arcora/cross_section_module/cs";

describe("Výpočty pod vektorem - plochaPodVektorem", () => {
    
    it("Vodorovná úsečka (čistý obdélník)", () => {
        const A = plochaPodVektorem(0, 4, 2, 2);
        expect(A).toBe(8); // dx = 4, dy = 0 -> obdélník 4 * 2
    });

    it("Šikmá úsečka z počátku (čistý trojúhelník)", () => {
        const A = plochaPodVektorem(0, 4, 0, 2);
        expect(A).toBe(4); // dx = 4, dy = 2 -> trojúhelník (4 * 2) / 2
    });

    it("Klasický lichoběžník v 1. kvadrantu", () => {
        const A = plochaPodVektorem(1, 5, 2, 6);
        expect(A).toBe(16); // obdélník (4 * 2 = 8) + trojúhelník ((4 * 4) / 2 = 8)
    });

    it("Vektor se zápornými souřadnicemi", () => {
        const A = plochaPodVektorem(-2, -6, -1, -3);
        expect(A).toBe(8); // funkce používá absolutní hodnoty, výsledek musí být kladný
    });

    it("Svislá úsečka (nulová šířka)", () => {
        const A = plochaPodVektorem(3, 3, 1, 5);
        expect(A).toBe(0); // dx = 0 -> plocha pod vektorem je 0
    });

    it("Úsečka napříč kvadranty", () => {
        const A = plochaPodVektorem(5, -4, 6, -3);
        expect(A).toBe(67.5); // dx = 0 -> plocha pod vektorem je 0
    });
});


import { tezistePlochyPodVektorem } from "@arcora/cross_section_module/cs"; // Opět si zkontroluj cestu

describe("Výpočty těžiště - tezistePlochyPodVektorem", () => {
    
    it("Vodorovná úsečka (obdélník) - Těžiště je přesně uprostřed", () => {
        // Obdélník od x=0 do x=4, výška y=2
        const [Xt, Yt] = tezistePlochyPodVektorem(0, 4, 2, 2);
        expect(Xt).toBeCloseTo(2); // Střed na X (4 / 2)
        expect(Yt).toBeCloseTo(1); // Střed na Y (2 / 2)
    });

    it("Šikmá úsečka z počátku (trojúhelník) - Těžiště ve 2/3 a 1/3", () => {
        // Trojúhelník od x=0 do x=4, y roste od 0 do 2
        const [Xt, Yt] = tezistePlochyPodVektorem(0, 4, 0, 2);
        expect(Xt).toBeCloseTo(2.6666666667, 5); // x = 2/3 z 4 = 8/3
        expect(Yt).toBeCloseTo(0.6666666667, 5); // y = 1/3 z 2 = 2/3
    });

    it("Opačně orientovaný trojúhelník (klesající)", () => {
        // Trojúhelník od x=0 do x=4, y klesá z 2 na 0
        const [Xt, Yt] = tezistePlochyPodVektorem(0, 4, 2, 0);
        expect(Xt).toBeCloseTo(1.3333333333, 5); // Blíže k počátku X
        expect(Yt).toBeCloseTo(0.6666666667, 5);
    });

    it("Úsečka tvořící 0 plochu (svislá) - Ošetření dělení nulou", () => {
        // Svislá čára na x=3
        const [Xt, Yt] = tezistePlochyPodVektorem(3, 3, 1, 5);
        expect(Xt).toBeCloseTo(0); 
        expect(Yt).toBeCloseTo(0); 
    });
});


import { momentySetrvacnostiPodVektorem } from "@arcora/cross_section_module/cs"; 

describe("Výpočty momentů setrvačnosti - momentySetrvacnostiPodVektorem", () => {
    
    it("Vodorovná úsečka (obdélník) k VLASTNÍMU těžišti", () => {
        // Obdélník b=4 (od x=0 do x=4), h=2. Těžiště je v bodě [2, 1]
        // Očekáváme základní momenty: Ix = 1/12 * 4 * 2^3 = 32/12 = 2.666...
        // Iy = 1/12 * 2 * 4^3 = 128/12 = 10.666...
        const [Ix, Iy] = momentySetrvacnostiPodVektorem(0, 4, 2, 2, 2, 1);
        expect(Ix).toBeCloseTo(2.6666666667, 5); 
        expect(Iy).toBeCloseTo(10.6666666667, 5);
    });

    it("Vodorovná úsečka (obdélník) k POČÁTKU (0,0) - Steinerova věta", () => {
        // Stejný obdélník, ale počítáme to k bodu [0, 0].
        // Přičte se plocha (8) * vzdálenost těžiště na druhou.
        // Ix_global = 2.666... + (8 * 1^2) = 10.666...
        // Iy_global = 10.666... + (8 * 2^2) = 42.666...
        const [Ix, Iy] = momentySetrvacnostiPodVektorem(0, 4, 2, 2, 0, 0);
        expect(Ix).toBeCloseTo(10.6666666667, 5); 
        expect(Iy).toBeCloseTo(42.6666666667, 5);
    });

    it("Šikmá úsečka (trojúhelník) k VLASTNÍMU těžišti", () => {
        // Trojúhelník b=3 (od x=0 do x=3), h=3 (od y=0 do y=3). 
        // Vlastní těžiště T = [2, 1]
        // Analyticky pro pravoúhlý trojúhelník k těžišti: I = 1/36 * b * h^3 = 1/36 * 3 * 27 = 2.25
        const [Ix, Iy] = momentySetrvacnostiPodVektorem(0, 3, 0, 3, 2, 1);
        expect(Ix).toBeCloseTo(2.25, 5);
        expect(Iy).toBeCloseTo(2.25, 5);
    });
});



import { deviacniMomentPodVektorem } from "@arcora/cross_section_module/cs"; 

describe("Výpočet deviačního momentu - deviacniMomentPodVektorem", () => {
    
    it("Vodorovná úsečka (obdélník) k VLASTNÍMU těžišti", () => {
        // Obdélník od x=0 do x=4, y=2. Těžiště je T = [2, 1]
        // K těžišti symetrického průřezu musí být deviační moment přesně nulový
        const Dxy = deviacniMomentPodVektorem(0, 4, 2, 2, 2, 1);
        expect(Dxy).toBeCloseTo(0, 5);
    });

    it("Vodorovná úsečka (obdélník) k POČÁTKU (0,0) - Steinerova věta", () => {
        // Stejný obdélník, počítáno k bodu [0, 0].
        // Steiner: Dxy_global = Dxy_lokal (0) + Plocha * x_t * y_t
        // Dxy_global = 0 + 8 * 2 * 1 = 16
        const Dxy = deviacniMomentPodVektorem(0, 4, 2, 2, 0, 0);
        expect(Dxy).toBeCloseTo(16, 5);
    });

    it("Šikmá úsečka (trojúhelník) s těžištěm na okraji (test zlomku 1/3 a 2/3)", () => {
        // Trojúhelník rostoucí (x1<x2 a y1<y2) od [0,0] do [3,3]
        // U něj hraje roli první podmínka (zlomek = 2/3, znamenko = 1)
        // Otestujeme k počátku (0,0)
        const Dxy = deviacniMomentPodVektorem(0, 3, 0, 3, 0, 0);
        
        // Plocha trojúhelníku = (3 * 3) / 2 = 4.5
        // Vlastní deviační moment: pro pravý trojúhelník (b^2 * h^2) / 72 = (9 * 9) / 72 = 1.125
        // Steiner: 1.125 + 4.5 * (2) * (1) = 1.125 + 9 = 10.125
        expect(Dxy).toBeCloseTo(10.125, 5);
    });
});



// Nezapomeň upravit cestu importu k souboru, kde máš třídu SpravceTeles


describe("Komplexní testování třídy - SpravceTeles", () => {
    let spravce: SpravceTeles;

    // Tento blok se spustí automaticky PŘED každým 'it' testem.
    // Zaručí, že do testu vstupuje vždy naprosto prázdná paměť.
    beforeEach(() => {
        spravce = new SpravceTeles();
    });

    it("Normální polygon: Obdélník 4x2 v počátku (Přičítání +)", () => {
        // Obdélník zadaný body: (0,0) -> (4,0) -> (4,2) -> (0,2)
        spravce.zpracujPolygon([0, 4, 4, 0], [0, 0, 2, 2], "+", 1.0, 210);

        // Ověříme, že se uložil do paměti právě jeden záznam
        expect(spravce.vsechny_plochy.length).toBe(1);

        // 1. Plocha (šířka 4 * výška 2 = 8)
        expect(spravce.vsechny_plochy[0]).toBeCloseTo(8, 5);

        // 2. Těžiště obdélníku (přesně uprostřed -> x=2, y=1)
        expect(spravce.vsechny_teziste[0]!.x).toBeCloseTo(2, 5);
        expect(spravce.vsechny_teziste[0]!.y).toBeCloseTo(1, 5);

        // 3. Momenty setrvačnosti k VLASTNÍMU těžišti
        // Ix = 1/12 * b * h^3 = 1/12 * 4 * 2^3 = 32/12 = 2.666...
        // Iy = 1/12 * h * b^3 = 1/12 * 2 * 4^3 = 128/12 = 10.666...
        expect(spravce.vsechny_momenty_setrvacnosti[0]![0]).toBeCloseTo(2.6666666667, 5);
        expect(spravce.vsechny_momenty_setrvacnosti[0]![1]).toBeCloseTo(10.6666666667, 5);

        // 4. Deviační moment symetrického tělesa k vlastním osám je 0
        expect(spravce.vsechny_dev_momenty[0]).toBeCloseTo(0, 5);

        // 5. Hmotnost na bm (ro * plocha * 1e-6 = 1.0 * 8 * 1e-6)
        expect(spravce.vsechny_hmotnosti[0]).toBeCloseTo(0.000008, 7);
    });

    it("Rizikový polygon 1: Pravoúhlý trojúhelník kompletně v záporných souřadnicích (+)", () => {
        // Trojúhelník ve 3. kvadrantu: (-3,-3) -> (0,-3) -> (0,0)
        spravce.zpracujPolygon([-3, 0, 0], [-3, -3, 0], "+", 2.0, 210);

        // 1. Plocha trojúhelníku (b * h / 2 = 3 * 3 / 2 = 4.5)
        expect(spravce.vsechny_plochy[0]).toBeCloseTo(4.5, 5);

        // 2. Těžiště (T_x = -3 + 2/3*3 = -1, T_y = -3 + 1/3*3 = -2)
        expect(spravce.vsechny_teziste[0]!.x).toBeCloseTo(-1, 5);
        expect(spravce.vsechny_teziste[0]!.y).toBeCloseTo(-2, 5);

        // 3. Momenty setrvačnosti k vlastnímu těžišti (1/36 * b * h^3 = 1/36 * 3 * 27 = 2.25)
        expect(spravce.vsechny_momenty_setrvacnosti[0]![0]).toBeCloseTo(2.25, 5);
        expect(spravce.vsechny_momenty_setrvacnosti[0]![1]).toBeCloseTo(2.25, 5);

        // 4. Hmotnost (ro=2.0 -> 2.0 * 4.5 * 1e-6)
        expect(spravce.vsechny_hmotnosti[0]).toBeCloseTo(0.000009, 7);

        expect(spravce.vsechny_dev_momenty[0]).toBeCloseTo(1.125, 5);
    });

    it("Rizikový polygon 2: Body zadané v opačném směru (proti směru hodinových ručiček)", () => {
        // Stejný obdélník 4x2, ale naklikaný v opačném pořadí: (0,0) -> (0,2) -> (4,2) -> (4,0)
        spravce.zpracujPolygon([0, 0, 4, 4], [0, 2, 2, 0], "+", 1.0, 210);
        
        // Tvá rovnice plochy s vektory je citlivá na směr otáčení,
        // ale jelikož jsi použil Math.abs(plocha_a_smer), výsledek musí vyjít kladný!
        expect(spravce.vsechny_plochy[0]).toBeCloseTo(8, 5);
        expect(spravce.vsechny_teziste[0]!.x).toBeCloseTo(2, 5);
        expect(spravce.vsechny_teziste[0]!.y).toBeCloseTo(1, 5);
        expect(spravce.vsechny_momenty_setrvacnosti[0]![0]).toBeCloseTo(2.6666666667, 5);
        expect(spravce.vsechny_momenty_setrvacnosti[0]![1]).toBeCloseTo(10.6666666667, 5);

        // 4. Deviační moment symetrického tělesa k vlastním osám je 0
        expect(spravce.vsechny_dev_momenty[0]).toBeCloseTo(0, 5);

        // 5. Hmotnost na bm (ro * plocha * 1e-6 = 1.0 * 8 * 1e-6)
        expect(spravce.vsechny_hmotnosti[0]).toBeCloseTo(0.000008, 7);
    });

    it("Odčítaný polygon: Menší obdélník (DÍRA) funguje jako odečet (-)", () => {
        // Obdélník 2x1 v parametrech
        spravce.zpracujPolygon([1, 3, 3, 1], [1, 1, 2, 2], "-", 1.0, 210);

        // Znaménko "-" by mělo převrátit hodnoty plochy, momentů a hmotnosti do mínusu
        // 1. Plocha = -2
        expect(spravce.vsechny_plochy[0]).toBeCloseTo(-2, 5);

        // 2. Těžiště (I u díry je těžiště reálný absolutní bod v prostoru -> x=2, y=1.5)
        // Zde se znaménko na mínus nemění!
        expect(spravce.vsechny_teziste[0]!.x).toBeCloseTo(2, 5);
        expect(spravce.vsechny_teziste[0]!.y).toBeCloseTo(1.5, 5);

        // 3. Momenty setrvačnosti musí být pro díru záporné
        // Ix = - (1/12 * 2 * 1^3) = -0.1666...
        // Iy = - (1/12 * 1 * 2^3) = -0.6666...
        expect(spravce.vsechny_momenty_setrvacnosti[0]![0]).toBeCloseTo(-0.1666666667, 5);
        expect(spravce.vsechny_momenty_setrvacnosti[0]![1]).toBeCloseTo(-0.6666666667, 5);
        
        // 4. Hmotnost díry = odečet hmotnosti
        expect(spravce.vsechny_hmotnosti[0]).toBeCloseTo(-0.000002, 7);
    });
});





