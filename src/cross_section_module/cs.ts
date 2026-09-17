import polygonClipping from 'polygon-clipping';

// ===== Pomocné funkce pro práci s polygon-clipping =====

// Absolutní plocha ringu (vnějšího obrysu) pomocí shoelace formule.
// Odolné i proti zacykleným ringům (poslední bod = první bod).
function plochaRingu(ring: ReadonlyArray<readonly [number, number]>): number {
    const n = ring.length;
    if (n < 3) return 0;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const x1 = ring[i]![0]!;
        const y1 = ring[i]![1]!;
        const x2 = ring[(i + 1) % n]![0]!;
        const y2 = ring[(i + 1) % n]![1]!;
        area += (x1 * y2 - x2 * y1);
    }
    return Math.abs(area / 2);
}

// Vyčistí MultiPolygon od degenerovaných tvarů s plochou pod prahem.
// Řeší "neviditelné slivery", které polygon-clipping občas vyprodukuje
// při odečítání tvarů, jež se přesně dotýkají hranou.
function vycistiMultiPolygon(
    mp: polygonClipping.MultiPolygon,
    prahPlochy = 1e-3
): polygonClipping.MultiPolygon {
    const vysledek: polygonClipping.MultiPolygon = [];
    for (const poly of mp) {
        const outer = poly[0]!;
        if (plochaRingu(outer as any) < prahPlochy) continue;
        const ocisteny: polygonClipping.MultiPolygon[number] = [outer];
        for (let h = 1; h < poly.length; h++) {
            const hRing = poly[h]!;
            if (plochaRingu(hRing as any) >= prahPlochy) {
                ocisteny.push(hRing);
            }
        }
        vysledek.push(ocisteny);
    }
    return vysledek;
}

export function plochaPodVektorem(x1: number, x2: number, y1: number, y2: number): number {
    return ((Math.abs(x1 - x2) * Math.abs(y1 - y2)) / 2) + (Math.abs(x1 - x2) * Math.min(Math.abs(y1), Math.abs(y2)));
}

export function tezistePlochyPodVektorem(x1: number, x2: number, y1: number, y2: number): [number, number] {
    let Xt = 0;
    let Yt = 0;

    // Spočítáme plochu jen jednou a uložíme do paměti
    const plocha = plochaPodVektorem(x1, x2, y1, y2);

    if (plocha === 0) {
        Yt = 0;
    } else {
        Yt = ((((Math.abs(x1 - x2) * Math.abs(y1 - y2)) / 2) * (Math.min(Math.abs(y1), Math.abs(y2)) + (Math.abs(y1 - y2)) / 3)) + ((Math.abs(x1 - x2) * Math.min(Math.abs(y1), Math.abs(y2))) * (Math.min(Math.abs(y1), Math.abs(y2)) / 2))) / plocha;
    }

    if (Math.abs(y1) > Math.abs(y2)) {
        if (x1 < x2) {
            Xt = ((((Math.abs(x1 - x2) * Math.abs(y1 - y2)) / 2) * ((x1 + (Math.abs(x2 - x1) * (1 / 3))))) + ((Math.abs(x1 - x2) * Math.min(Math.abs(y1), Math.abs(y2)))) * (Math.abs(x1 - x2) / 2 + x1)) / plocha; // čtvrtý kvadrant
        } else if (x1 > x2) {
            Xt = ((((Math.abs(x1 - x2) * Math.abs(y1 - y2)) / 2) * ((x1 - (Math.abs(x2 - x1) * (1 / 3))))) + ((Math.abs(x1 - x2) * Math.min(Math.abs(y1), Math.abs(y2)))) * (Math.abs(x1 - x2) / 2 + x2)) / plocha; // třetí kvadrant
        }
    } else if (Math.abs(y2) > Math.abs(y1)) {
        if (x1 < x2) {
            Xt = ((((Math.abs(x1 - x2) * Math.abs(y1 - y2)) / 2) * ((x2 - (Math.abs(x2 - x1) * (1 / 3))))) + ((Math.abs(x1 - x2) * Math.min(Math.abs(y1), Math.abs(y2)))) * (Math.abs(x1 - x2) / 2 + x1)) / plocha; // první kvadrant
        } else if (x1 > x2) {
            Xt = ((((Math.abs(x1 - x2) * Math.abs(y1 - y2)) / 2) * ((x2 + (Math.abs(x2 - x1) * (1 / 3))))) + ((Math.abs(x1 - x2) * Math.min(Math.abs(y1), Math.abs(y2)))) * (Math.abs(x1 - x2) / 2 + x2)) / plocha; // druhý kvadrant
        }
    } else if (Math.abs(y1) === Math.abs(y2)) {
        Xt = ((Math.abs(x1 - x2) / 2) + Math.min(x1, x2));
    }

    return [Xt, Yt];
}


export function momentySetrvacnostiPodVektorem(x1: number, x2: number, y1: number, y2: number, tezisteX: number, tezisteY: number): [number, number] {
    // Určení zlomku pro polohu těžiště trojúhelníkové části (Steinerův doplněk)
    const zlomek = ((x1 < x2 && y1 < y2) || (x1 > x2 && y1 > y2)) ? 2 / 3 : 1 / 3;

    // Výpočet Ix
    const Ix = (1 / 36) * Math.abs(x2 - x1) * Math.abs(y2 - y1) ** 3
        + Math.abs(x2 - x1) * Math.abs(y2 - y1) * (1 / 2) * ((Math.abs(y2 - y1) * (1 / 3) + Math.min(y2, y1)) - tezisteY) ** 2
        + (1 / 12) * Math.abs(x2 - x1) * Math.min(y2, y1) ** 3
        + Math.abs(x2 - x1) * Math.min(y2, y1) * (Math.min(y2, y1) * (1 / 2) - tezisteY) ** 2;

    // Výpočet Iy
    const Iy = (1 / 36) * Math.abs(x2 - x1) ** 3 * Math.abs(y2 - y1)
        + Math.abs(x2 - x1) * Math.abs(y2 - y1) * (1 / 2) * ((Math.abs(x2 - x1) * zlomek + Math.min(x2, x1)) - tezisteX) ** 2
        + (1 / 12) * Math.abs(x2 - x1) ** 3 * Math.min(y2, y1)
        + Math.abs(x2 - x1) * Math.min(y2, y1) * (Math.abs(x2 - x1) * (1 / 2) + Math.min(x2, x1) - tezisteX) ** 2;

    return [Ix, Iy];
}


export function deviacniMomentPodVektorem(x1: number, x2: number, y1: number, y2: number, tezisteX: number, tezisteY: number): number {
    let zlomek: number;
    let znamenkoDevMomentu: number;

    if ((x1 < x2 && y1 < y2) || (x1 > x2 && y1 > y2)) {
        zlomek = 2 / 3;
        znamenkoDevMomentu = 1;
    } else {
        zlomek = 1 / 3;
        znamenkoDevMomentu = -1;
    }

    const Dxy = znamenkoDevMomentu * (1 / 72) * Math.abs(x2 - x1) ** 2 * Math.abs(y2 - y1) ** 2
        + Math.abs(x2 - x1) * Math.abs(y2 - y1) * (1 / 2) * ((Math.abs(y2 - y1) * (1 / 3) + Math.min(y2, y1)) - tezisteY) * ((Math.abs(x2 - x1) * zlomek + Math.min(x2, x1)) - tezisteX)
        + Math.abs(x2 - x1) * Math.min(y2, y1) * (Math.abs(Math.min(y2, y1) * (1 / 2)) - tezisteY) * ((Math.abs(x2 - x1) * (1 / 2) + Math.min(x2, x1)) - tezisteX);

    return Dxy;
}




//PLOCHA.PY

export type Smernice =
    | { typ: "klasicka"; a: number; b: number }
    | { typ: "svisla"; x: number };

export interface Bod {
    x: number;
    y: number;
}

export interface CelkoveCharakteristiky {
    vysledna_plocha: number;
    vysledna_plocha_id: number;
    celkova_hmotnost: number;
    celkova_vyska_h: number;
    celkova_sirka_b: number;
    teziste_x: number;
    teziste_y: number;
    vysledny_moment_x: number;
    vysledny_moment_y: number;
    vysledny_dev_moment: number;
    alfa_rad: number;
    alfa_deg: number;
    vysledny_moment_max: number;
    vysledny_moment_min: number;
    W_x_h: number;
    W_x_d: number;
    W_y_p: number;
    W_y_l: number;
    W_max_h: number;
    W_max_d: number;
    W_min_p: number;
    W_min_l: number;
    i_x: number;
    i_y: number;
    i_max: number;
    i_min: number;
}

export type TypZatizeni = "bodove" | "liniove" | "plosne";

export interface ZadaniZatizeni {
    hodnota: number; // Bodové [N], Liniové [N/m], Plošné [N/m^2]
    x_val: number[]; // Souřadnice X pro zadání
    y_val: number[]; // Souřadnice Y pro zadání
}

// --- NOVÉ OBECNÉ ROZHRANÍ PRO VÝSLEDEK ---
export interface SouhrnRovnicNapeti {
    rovnice: RovniceNapeti[];
    a_null_line?: number;
    b_null_line?: number;
    x_null_line?: number;
}

// --- UPRAVENÉ ROZHRANÍ PRO KONKRÉTNÍ POLYGON ---
export interface RovniceNapeti {
    polygon_id: string | number;
    a_plane: number;
    b_plane: number;
    c_plane: number;
    rovnice_text: string;
    pruseciky_x?: number[]; // Ponecháme pouze průsečíky
}

export class Vrchol {
    public readonly id: string;
    public readonly polygonId: string; // Odkaz na mateřský polygon
    
    // Souřadnice vrcholu
    public x: number;
    public y: number;

    constructor(polygonId: string, x: number, y: number, id?: string) {
        // Pokud id nepřijde zvenčí, vygeneruje se nové
        this.id = id || crypto.randomUUID();
        this.polygonId = polygonId;
        this.x = x;
        this.y = y;
    }

    // Metoda pro export do čistého datového objektu (podobně jako má kolega toData())
    toData() {
        return {
            id: this.id,
            polygonId: this.polygonId,
            x: this.x,
            y: this.y
        };
    }
}

export class Polygon {
    // 1. ZMĚNA: Polygon má nyní jako hlavní zdroj pravdy pole objektů Vrchol
    vrcholy: Vrchol[];
    
    kladne: boolean;
    ro: number;
    E: number;
    id: string;

    vysledky?: {
        smernice: Smernice[];
        plocha: number;
        moment_setrvacnosti: [number, number];
        deviacni_moment: number;
        hmotnost: number;
        teziste: Bod;
    }

    // 2. ZMĚNA: Gettery zajišťují, že pokud jiný kód ve tvé aplikaci 
    // přistupuje k poly.x_val nebo poly.y_val, dostane stále pole čísel (zpětná kompatibilita).
    get x_val(): number[] {
        return this.vrcholy.map(v => v.x);
    }

    get y_val(): number[] {
        return this.vrcholy.map(v => v.y);
    }

    constructor(x_values: number[], y_values: number[], kladne: boolean, ro: number, E: number, id?: string) {
        this.id = id || crypto.randomUUID();
        this.kladne = kladne;
        this.ro = ro;
        this.E = E;
        
        // 3. ZMĚNA: Inicializace vrcholů do nového pole
        this.vrcholy = [];
        for (let i = 0; i < x_values.length; i++) {
            this.vrcholy.push(new Vrchol(this.id, x_values[i]!, y_values[i]!));
        }

        this.vypocet();
    }

    update(x_values: number[], y_values: number[], kladne: boolean, ro: number, E: number): void {
        this.kladne = kladne;
        this.ro = ro;
        this.E = E;
        
        // Přepsání vrcholů při aktualizaci
        this.vrcholy = [];
        for (let i = 0; i < x_values.length; i++) {
            this.vrcholy.push(new Vrchol(this.id, x_values[i]!, y_values[i]!));
        }

        this.vypocet();
    }

    public vypocet(): void {
        // 4. ZMĚNA: Úprava validace a uzavření polygonu tak, aby pracovala s objekty Vrchol
        if (this.vrcholy.length < 3) {
            throw new Error("Pro výpočet zadejte alespoň 3 body");
        }

        // Zkontrolovat jestli první a poslední body jsou stejné - kdyžtak fixnout
        const prvniVrchol = this.vrcholy[0]!;
        const posledniVrchol = this.vrcholy[this.vrcholy.length - 1]!;
        
        if (prvniVrchol.x !== posledniVrchol.x || prvniVrchol.y !== posledniVrchol.y) {
            // Vloží referenci na stejný objekt vrcholu, takže frontend ví, že jde o jeden a ten samý uzel
            this.vrcholy.push(prvniVrchol); 
        }

        // 5. ZMĚNA: Vytvoření lokálních polí x_val a y_val. 
        // Díky tomu zbytek tvé matematické funkce (níže) zůstává naprosto stejný bez nutnosti zásahu.
        const x_val = this.vrcholy.map(v => v.x);
        const y_val = this.vrcholy.map(v => v.y);

        // --- VÝPOČET SMĚRNIC (a, b) ---
        const smernice_polygonu: Smernice[] = [];
        const eps = 1e-9;

        for (let i = 0; i < x_val.length - 1; i++) {
            const x1 = x_val[i]!;
            const y1 = y_val[i]!;
            const x2 = x_val[i + 1]!;
            const y2 = y_val[i + 1]!;

            if (Math.abs(x1 - x2) < eps) {
                smernice_polygonu.push({ typ: "svisla", x: x1 });
            } else {
                const a = (y1 - y2) / (x1 - x2);
                const b = y1 - a * x1;
                smernice_polygonu.push({ typ: "klasicka", a: a, b: b });
            }
        }

        // --- POČÁTEK SOUŘADNÉHO SYSTÉMU S PŘEPOČTEM ---
        const pocatek_x = Math.min(...x_val);
        const pocatek_y = Math.min(...y_val);

        const x_val_n = x_val.map(x => x - pocatek_x);
        const y_val_n = y_val.map(y => y - pocatek_y);

        // --- PLOCHA A TĚŽIŠTĚ POD VEKTORY ---
        let suma_plochy_kladne = 0, suma_plochy_zaporne = 0;
        let suma_moment_plochy_x_kladne = 0, suma_moment_plochy_x_zaporne = 0;
        let suma_moment_plochy_y_kladne = 0, suma_moment_plochy_y_zaporne = 0;

        for (let i = 0; i < x_val_n.length - 1; i++) {
            const x1 = x_val_n[i]!;
            const x2 = x_val_n[i + 1]!;
            const y1 = y_val_n[i]!;
            const y2 = y_val_n[i + 1]!;

            const plocha = plochaPodVektorem(x1, x2, y1, y2);
            const [Xt, Yt] = tezistePlochyPodVektorem(x1, x2, y1, y2);

            if (x2 - x1 > 0) {
                suma_plochy_kladne += plocha;
                suma_moment_plochy_x_kladne += plocha * Xt;
                suma_moment_plochy_y_kladne += plocha * Yt;
            } else {
                suma_plochy_zaporne += plocha;
                suma_moment_plochy_x_zaporne += plocha * Xt;
                suma_moment_plochy_y_zaporne += plocha * Yt;
            }
        }

        const plocha_a_smer = suma_plochy_kladne - suma_plochy_zaporne;
        const plocha_abs = Math.abs(plocha_a_smer);

        // --- SUMA TĚŽIŠŤ ---
        let XT = 0, YT = 0;
        if (plocha_abs > 0) {
            if (plocha_a_smer > 0) {
                XT = (suma_moment_plochy_x_kladne - suma_moment_plochy_x_zaporne) / plocha_abs;
                YT = (suma_moment_plochy_y_kladne - suma_moment_plochy_y_zaporne) / plocha_abs;
            } else {
                XT = (-suma_moment_plochy_x_kladne + suma_moment_plochy_x_zaporne) / plocha_abs;
                YT = (-suma_moment_plochy_y_kladne + suma_moment_plochy_y_zaporne) / plocha_abs;
            }
        }

        const teziste_vysledne: Bod = { x: XT + pocatek_x, y: YT + pocatek_y };

        // --- MOMENTY SETRVAČNOSTI A DEVIAČNÍ MOMENT ---
        let Ix_kladne = 0, Ix_zaporne = 0;
        let Iy_kladne = 0, Iy_zaporne = 0;
        let Dxy_kladne = 0, Dxy_zaporne = 0;

        for (let i = 0; i < x_val_n.length - 1; i++) {
            const x1 = x_val_n[i]!;
            const x2 = x_val_n[i + 1]!;
            const y1 = y_val_n[i]!;
            const y2 = y_val_n[i + 1]!;

            const [Ix, Iy] = momentySetrvacnostiPodVektorem(x1, x2, y1, y2, XT, YT);
            const Dxy = deviacniMomentPodVektorem(x1, x2, y1, y2, XT, YT);

            if (x2 - x1 > 0) {
                Ix_kladne += Ix; Iy_kladne += Iy; Dxy_kladne += Dxy;
            } else {
                Ix_zaporne += Ix; Iy_zaporne += Iy; Dxy_zaporne += Dxy;
            }
        }

        const vysledny_Ix = Math.abs(Ix_kladne - Ix_zaporne);
        const vysledny_Iy = Math.abs(Iy_kladne - Iy_zaporne);
        let deviacni_moment = Dxy_kladne - Dxy_zaporne;
        if (plocha_a_smer < 0) deviacni_moment = -deviacni_moment;

        // --- HMOTNOST ---
        const hmotnost_1bm = this.ro * plocha_abs * 1e-6;
        const nasobitel = this.kladne ? 1 : -1;

        // --- ULOŽENÍ NEBO AKTUALIZACE DO GLOBÁLNÍ PAMĚTI ---
        this.vysledky = {
            smernice: smernice_polygonu,
            plocha: plocha_abs * nasobitel,
            moment_setrvacnosti: [vysledny_Ix * nasobitel, vysledny_Iy * nasobitel],
            deviacni_moment: deviacni_moment * nasobitel,
            hmotnost: hmotnost_1bm * nasobitel,
            teziste: teziste_vysledne
        };
    }
}


export class SpravceTeles {
    polygony: Polygon[] = [];
    plocha: number = 0;
    pruseciky: Bod[] = [];
    zvolene_E_ref?: number;

        // Vrátí aktuální materiál (E, ro) jako MultiPolygon.
    // Polygony se aplikují v pořadí, v jakém jsou v this.polygony:
    //   kladný = union, záporný = difference.
    // Toto pořadí odpovídá pořadí, v jakém je uživatel vytvářel, což dává
    // správný výsledek (P1, díra H, ostrůvek N, mostek B, …).
    public resolveMaterial(E: number, ro: number): polygonClipping.MultiPolygon {
        let result: polygonClipping.MultiPolygon = [];
        for (const poly of this.polygony) {
            if (poly.E !== E || poly.ro !== ro) continue;
            const ring = poly.x_val.map((x, i) => [x, poly.y_val[i]!] as [number, number]);
            if (poly.kladne) {
                result = polygonClipping.union(result, [ring]);
            } else {
                result = polygonClipping.difference(result, [ring]);
            }
        }
        return result;
    }

    // Seřadí polygony podle hloubky vnoření (kolik jiných polygonů je obsahuje).
    // Slouží k tomu, aby v this.polygony byly vždy „vnější" tvary dřív než jejich díry
    // a ostrůvky uvnitř děr. Tím je zaručeno, že resolveMaterial v dalším kroku
    // vyhodnotí vztahy správně.
    private sortByDepth(polys: Polygon[]): Polygon[] {
        if (polys.length <= 1) return polys;

        const rings = polys.map(p =>
            p.x_val.map((x, i) => [x, p.y_val[i]!] as [number, number])
        );

        const depths = polys.map((_, i) => {
            let d = 0;
            const ringI = rings[i]!;
            for (let j = 0; j < polys.length; j++) {
                if (i === j) continue;
                const ringJ = rings[j]!;
                // polys[i] je uvnitř polys[j], pokud všechny jeho vrcholy leží v j.
                if (ringI.every(([x, y]) => this.pointInRing(x, y, ringJ))) d++;
            }
            return d;
        });

        const indices = polys.map((_, i) => i);
        indices.sort((a, b) => {
            if (depths[a] !== depths[b]) return depths[a]! - depths[b]!;
            const absA = Math.abs(polys[a]!.vysledky?.plocha ?? 0);
            const absB = Math.abs(polys[b]!.vysledky?.plocha ?? 0);
            return absB - absA; // větší první (stabilnější pořadí)
        });

        return indices.map(i => polys[i]!);
    }

    // Test bodu uvnitř ringu (ray casting, funguje pro libovolný jednoduchý polygon).
    private pointInRing(px: number, py: number, ring: [number, number][]): boolean {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i]!;
            const [xj, yj] = ring[j]!;
            const intersect =
                ((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // --- NOVÁ METODA PRO MODELOVÁNÍ TVARŮ (BOOLEAN OPERACE) ---
    public zpracujNovyTvar(x_coords: number[], y_coords: number[], E: number, ro: number, jeToPlus: boolean): void {
        const novyKruh = x_coords.map((x, i) => [x, y_coords[i]!] as [number, number]);

        // Ochranná brzda: degenerovaný vstup
        if (plochaRingu(novyKruh) < 1e-6) return;

        // 1) Aktuální materiál (E, ro) jako MultiPolygon (v pořadí, v jakém byl
        //    vytvářen – to je důležité pro správné vyhodnocení boolean operací).
        const current = this.resolveMaterial(E, ro);

        // 2) Aplikace nového tvaru: + = union, − = difference.
        //    Tím se přirozeně vyřeší VŠECHNY případy: sloučení dvou kusů,
        //    vyplnění části otvoru, odečtení přes ostrůvek, obkreslení atd.
        let newMaterial: polygonClipping.MultiPolygon;
        if (jeToPlus) {
            newMaterial = polygonClipping.union(current, [novyKruh]);
        } else {
            newMaterial = polygonClipping.difference(current, [novyKruh]);
        }
        newMaterial = vycistiMultiPolygon(newMaterial);

        // 3) Polygony jiných materiálů necháváme beze změny.
        const otherPolys = this.polygony.filter(p => p.E !== E || p.ro !== ro);

        // 4) Re-dekompozice: každý „kus" MultiPolygonu → kladný Polygon s vnějším ringem
        //    + záporné Polygony pro každou díru. Ostrůvky uvnitř děr vyjdou jako
        //    samostatné kladné polygony (přesně jako když je uživatel nakreslí).
        const newPolys: Polygon[] = [];
        for (const part of newMaterial) {
            const outer = part[0]!;
            const outerX = outer.map(p => p[0]);
            const outerY = outer.map(p => p[1]);
            newPolys.push(new Polygon(outerX, outerY, true, ro, E));

            for (let h = 1; h < part.length; h++) {
                const hole = part[h]!;
                const holeX = hole.map(p => p[0]);
                const holeY = hole.map(p => p[1]);
                newPolys.push(new Polygon(holeX, holeY, false, ro, E));
            }
        }

        // 5) Seřadit podle hloubky vnoření, aby budoucí resolveMaterial()
        //    vyhodnocoval v pořadí: vnější kladný → jeho díry → ostrůvky v dírách → …
        //    (Bez tohoto by mohl polygon-clipping vrátit kusy v libovolném pořadí
        //    a ostrůvek by se v dalším kroku mohl chovat jako by nebyl.)
        const sortedNewPolys = this.sortByDepth(newPolys);

        // 6) Nahradit polygony tohoto materiálu; ostatní materiály zachovat.
        this.polygony = [...otherPolys, ...sortedNewPolys];
    }

    // Vypočet průsečíků všech přímek ze všech polygonů navzájem
    aktualizujPruseciky(): void {
        // Nejdříve vyprázdníme staré průsečíky
        this.pruseciky = [];

        // Procházíme všechny polygony proti sobě (bez duplicit a porovnávání se sebou samým)
        for (let i = 0; i < this.polygony.length; i++) {
            for (let j = i + 1; j < this.polygony.length; j++) {

                const poly1 = this.polygony[i]!;
                const poly2 = this.polygony[j]!;

                // Bezpečnostní pojistka v TypeScriptu: 
                // Kdyby náhodou polygon neměl spočítané výsledky, přeskočíme ho
                if (!poly1.vysledky || !poly2.vysledky) {
                    continue;
                }

                // Vytáhneme si směrnice přímo z konkrétních polygonů
                const smernice_poly1 = poly1.vysledky.smernice;
                const smernice_poly2 = poly2.vysledky.smernice;

                // Procházíme všechny hrany prvního polygonu proti všem hranám druhého
                for (let k = 0; k < smernice_poly1.length; k++) {
                    for (let l = 0; l < smernice_poly2.length; l++) {

                        const s1 = smernice_poly1[k]!;
                        const s2 = smernice_poly2[l]!;

                        if (s1.typ === "svisla" && s2.typ === "svisla") {
                            // Obě přímky jsou svislé -> nikdy se neprotnou (jsou rovnoběžné)
                            continue;
                        }
                        else if (s1.typ === "svisla" && s2.typ === "klasicka") {
                            // První je svislá (má fixní X), druhá je klasická (y = ax + b)
                            const x = s1.x;
                            const y = s2.a * x + s2.b;
                            this.pruseciky.push({ x, y });
                        }
                        else if (s1.typ === "klasicka" && s2.typ === "svisla") {
                            // První je klasická, druhá je svislá
                            const x = s2.x;
                            const y = s1.a * x + s1.b;
                            this.pruseciky.push({ x, y });
                        }
                        else if (s1.typ === "klasicka" && s2.typ === "klasicka") {
                            // Obě jsou klasické (y = ax + b)
                            if (Math.abs(s1.a - s2.a) < 1e-9) {
                                // Směrnice "a" jsou téměř stejné -> rovnoběžky
                                continue;
                            }
                            // Výpočet průsečíku
                            const x = (s2.b - s1.b) / (s1.a - s2.a);
                            const y = s1.a * x + s1.b;
                            this.pruseciky.push({ x, y });
                        }
                    }
                }
            }
        }
    }

    spocitejCelkove(): CelkoveCharakteristiky {
        // Vyfiltrujeme pouze polygony, které mají úspěšně spočítané výsledky
        const validniPolygony = this.polygony.filter(p => p.vysledky !== undefined);

        if (validniPolygony.length === 0) {
            return {
                vysledna_plocha: 0,
                vysledna_plocha_id: 0,
                celkova_hmotnost: 0,
                celkova_vyska_h: 0,
                celkova_sirka_b: 0,
                teziste_x: 0,
                teziste_y: 0,
                vysledny_moment_x: 0,
                vysledny_moment_y: 0,
                vysledny_dev_moment: 0,
                alfa_rad: 0,
                alfa_deg: 0,
                vysledny_moment_max: 0,
                vysledny_moment_min: 0,
                W_x_h: 0,
                W_x_d: 0,
                W_y_p: 0,
                W_y_l: 0,
                W_max_h: 0,
                W_max_d: 0,
                W_min_p: 0,
                W_min_l: 0,
                i_x: 0,
                i_y: 0,
                i_max: 0,
                i_min: 0
            };
        }

        // --- 1. CELKOVÁ PLOCHA A HMOTNOST ---
        const vysledna_plocha = validniPolygony.reduce((suma, poly) => suma + poly.vysledky!.plocha, 0);
        const celkova_hmotnost = validniPolygony.reduce((suma, poly) => suma + poly.vysledky!.hmotnost, 0);

        // --- 2. REFERENČNÍ MATERIÁL (E_ref) ---
        // Vezmeme buď zadané E_ref, nebo najdeme maximální E ze zadaných polygonů
        const E_ref = this.zvolene_E_ref !== undefined 
            ? this.zvolene_E_ref 
            : Math.max(...validniPolygony.map(p => p.E));

        // --- 3. CELKOVÉ E TĚŽIŠTĚ A IDEÁLNÍ PLOCHA ---
        let jmenovatel_E = 0;
        let citatel_x = 0;
        let citatel_y = 0;

        for (const poly of validniPolygony) {
            const E_A = poly.E * poly.vysledky!.plocha;
            jmenovatel_E += E_A;
            citatel_x += E_A * poly.vysledky!.teziste.x;
            citatel_y += E_A * poly.vysledky!.teziste.y;
        }

        const vysledne_Eteziste_x = jmenovatel_E !== 0 ? citatel_x / jmenovatel_E : 0;
        const vysledne_Eteziste_y = jmenovatel_E !== 0 ? citatel_y / jmenovatel_E : 0;

        // Výpočet ideální plochy (vydělením E_ref dostaneme Σ(A_i * (E_i / E_ref)))
        const vysledna_plocha_id = jmenovatel_E / E_ref;

        // --- 4. STEINEROVA VĚTA: MOMENTY A DEVIAČNÍ MOMENT ---
        let vysledny_moment_x = 0;
        let vysledny_moment_y = 0;
        let vysledny_dev_moment = 0;

        for (const poly of validniPolygony) {
            const A = poly.vysledky!.plocha;
            const pomerni_E = poly.E / E_ref;
            const [I_x, I_y] = poly.vysledky!.moment_setrvacnosti;
            const D_xy = poly.vysledky!.deviacni_moment;
            const t_x = poly.vysledky!.teziste.x;
            const t_y = poly.vysledky!.teziste.y;

            // Posun na ose X a Y k celkovému E-těžišti
            const dx = t_x - vysledne_Eteziste_x;
            const dy = t_y - vysledne_Eteziste_y;

            vysledny_moment_x += (I_x + A * Math.pow(dy, 2)) * pomerni_E;
            vysledny_moment_y += (I_y + A * Math.pow(dx, 2)) * pomerni_E;
            vysledny_dev_moment += (D_xy + A * dy * dx) * pomerni_E;
        }

        // --- 5. HLAVNÍ MOMENTY SETRVAČNOSTI ---
        const moment_prumer = 0.5 * (vysledny_moment_x + vysledny_moment_y);
        const moment_rozdil = 0.5 * Math.sqrt(Math.pow(vysledny_moment_x - vysledny_moment_y, 2) + 4 * Math.pow(vysledny_dev_moment, 2));
        
        const vysledny_moment_max = moment_prumer + moment_rozdil;
        const vysledny_moment_min = moment_prumer - moment_rozdil;

        // --- 6. HLAVNÍ ÚHEL NATOČENÍ ---
        const citatel_uhlu = 2 * vysledny_dev_moment;
        const jmenovatel_uhlu = vysledny_moment_x - vysledny_moment_y;

        // Numerická stabilita pro téměř symetrické průřezy:
        // Pokud jsou OBA členy (2·Dxy i Ix − Iy) řádově zanedbatelné vzhledem k velikosti
        // hlavních momentů, považujeme průřez za symetrický → α = 0.
        // Bez tohoto ošetření by drobné zaokrouhlovací chyby (např. z ortho snapu, kde
        // cos(90°) v JS není přesně 0 ale 6.12e-17) způsobily, že atan2(ε₁, ε₂) vrací
        // naprosto náhodný úhel — proto se α u "stejných" čtverců lišilo pokaždé.
        const scale_moment = Math.max(
            Math.abs(vysledny_moment_x),
            Math.abs(vysledny_moment_y),
            Math.abs(vysledny_moment_max),
            Math.abs(vysledny_moment_min)
        ) || 1;
        const eps_alpha = 1e-8 * scale_moment;

        const jeSymetricky =
            Math.abs(citatel_uhlu) < eps_alpha &&
            Math.abs(jmenovatel_uhlu) < eps_alpha;

        const alfa_rad = jeSymetricky ? 0 : 0.5 * Math.atan2(citatel_uhlu, jmenovatel_uhlu);
        const alfa_deg = alfa_rad * (180 / Math.PI);

        // --- 7. EXTRÉMNÍ SOUŘADNICE KLADNÝCH POLYGONŮ ---
        // Vytáhneme pouze body z polygonů s kladným znaménkem (značí vnější hrany průřezu, bez děr)
        let max_x_kladne = -Infinity, min_x_kladne = Infinity;
        let max_y_kladne = -Infinity, min_y_kladne = Infinity;
        
        const u_values_kladne: number[] = [];
        const v_values_kladne: number[] = [];

        for (const poly of validniPolygony) {
            if (poly.kladne) {
                for (let j = 0; j < poly.x_val.length; j++) {
                    const x = poly.x_val[j]!;
                    const y = poly.y_val[j]!;

                    // Klasické extrémy (Bounding box)
                    if (x > max_x_kladne) max_x_kladne = x;
                    if (x < min_x_kladne) min_x_kladne = x;
                    if (y > max_y_kladne) max_y_kladne = y;
                    if (y < min_y_kladne) min_y_kladne = y;

                    // Pootočené extrémy k hlavní ose (rotace k lokálnímu těžišti)
                    const dx = x - vysledne_Eteziste_x;
                    const dy = y - vysledne_Eteziste_y;
                    
                    const u = dx * Math.cos(-alfa_rad) + dy * Math.sin(-alfa_rad);
                    const v = -dx * Math.sin(-alfa_rad) + dy * Math.cos(-alfa_rad);
                    
                    u_values_kladne.push(u);
                    v_values_kladne.push(v);
                }
            }
        }

        // --- 8. MODULY PRŮŘEZU ---
        const W_x_h = vysledny_moment_x / (Math.abs(max_y_kladne - vysledne_Eteziste_y) || 1e-9);
        const W_x_d = vysledny_moment_x / (Math.abs(min_y_kladne - vysledne_Eteziste_y) || 1e-9);
        const W_y_p = vysledny_moment_y / (Math.abs(max_x_kladne - vysledne_Eteziste_x) || 1e-9);
        const W_y_l = vysledny_moment_y / (Math.abs(min_x_kladne - vysledne_Eteziste_x) || 1e-9);

        // --- 9. HLAVNÍ MODULY PRŮŘEZU ---
        const max_v_kladne = u_values_kladne.length > 0 ? Math.max(...v_values_kladne) : 1e-9;
        const min_v_kladne = u_values_kladne.length > 0 ? Math.min(...v_values_kladne) : -1e-9;
        const max_u_kladne = u_values_kladne.length > 0 ? Math.max(...u_values_kladne) : 1e-9;
        const min_u_kladne = u_values_kladne.length > 0 ? Math.min(...u_values_kladne) : -1e-9;

        const W_max_h = vysledny_moment_max / (Math.abs(max_v_kladne) || 1e-9);
        const W_max_d = vysledny_moment_max / (Math.abs(min_v_kladne) || 1e-9);
        const W_min_p = vysledny_moment_min / (Math.abs(max_u_kladne) || 1e-9);
        const W_min_l = vysledny_moment_min / (Math.abs(min_u_kladne) || 1e-9);

        // --- 10. POLOMĚRY SETRVAČNOSTI ---
        const plocha_pro_i = vysledna_plocha_id || 1e-9; // Pojistka proti dělení nulou

        const i_x = Math.sqrt(vysledny_moment_x / plocha_pro_i);
        const i_y = Math.sqrt(vysledny_moment_y / plocha_pro_i);
        const i_max = Math.sqrt(vysledny_moment_max / plocha_pro_i);
        const i_min = Math.sqrt(vysledny_moment_min / plocha_pro_i);

        // --- 11. ROZMĚRY PRŮŘEZU ---
        const celkova_vyska_h = Math.abs(max_y_kladne - min_y_kladne);
        const celkova_sirka_b = Math.abs(max_x_kladne - min_x_kladne);

        return {
            vysledna_plocha,
            vysledna_plocha_id,
            celkova_hmotnost,
            celkova_vyska_h,
            celkova_sirka_b,
            teziste_x: vysledne_Eteziste_x,
            teziste_y: vysledne_Eteziste_y,
            vysledny_moment_x,
            vysledny_moment_y,
            vysledny_dev_moment,
            alfa_rad,
            alfa_deg,
            vysledny_moment_max,
            vysledny_moment_min,
            W_x_h,
            W_x_d,
            W_y_p,
            W_y_l,
            W_max_h,
            W_max_d,
            W_min_p,
            W_min_l,
            i_x,
            i_y,
            i_max,
            i_min
        };
    }

    upravBod(idTvaru: string, idVrcholu: string, modelX: number, modelY: number): void {
        // 1. Nalezení polygonu a vrcholu
        const indexTvaru = this.polygony.findIndex(p => p.id === idTvaru);
        if (indexTvaru === -1) {
            console.warn(`Polygon s ID ${idTvaru} nebyl nalezen.`);
            return;
        }

        const polygon = this.polygony[indexTvaru]!;
        const vrchol = polygon.vrcholy.find(v => v.id === idVrcholu);
        
        if (!vrchol) {
            console.warn(`Vrchol s ID ${idVrcholu} nebyl nalezen.`);
            return;
        }

        // 2. Úprava souřadnic a lokální přepočet
        vrchol.x = modelX;
        vrchol.y = modelY;
        polygon.vypocet();

        // 3. CHYTRÁ KONTROLA PRO OTVORY (MÍNUSOVÉ POLYGONY)
        if (!polygon.kladne) {
            // Převedení aktuálního otvoru do formátu polygon-clipping
            const minusKruh = polygon.x_val.map((x, i) => [x, polygon.y_val[i]!] as [number, number]);
            const formatMinus = [minusKruh];

            let jeZcelaUvnitr = false;
            let protinajiciPlusPoly: Polygon | null = null;
            let protinajiciFormatPlus: polygonClipping.Geom | null = null;

            // Kontrola proti všem existujícím kladným tělesům
            for (let i = 0; i < this.polygony.length; i++) {
                const plusPoly = this.polygony[i]!;
                if (!plusPoly.kladne) continue;

                const plusKruh = plusPoly.x_val.map((x, j) => [x, plusPoly.y_val[j]!] as [number, number]);
                const formatPlus = [plusKruh];

                // a) Zjistíme, zda je náš upravovaný otvor STÁLE ZCELA UVNITŘ
                const zbytekZMinus = polygonClipping.difference([formatMinus], [formatPlus]);
                if (zbytekZMinus.length === 0) {
                    jeZcelaUvnitr = true;
                    break; // Našli jsme rodiče a jsme uvnitř, můžeme testování ukončit
                }

                // b) Zjistíme, jestli se s tělesem alespoň částečně protínáme (pro případný ořez)
                if (!protinajiciPlusPoly) {
                    const prunik = polygonClipping.intersection([formatMinus], [formatPlus]);
                    if (prunik.length > 0) {
                        protinajiciPlusPoly = plusPoly;
                        protinajiciFormatPlus = [formatPlus];
                    }
                }
            }

            // 4. Pokud otvor porušil hranici (není už zcela uvnitř), provedeme trvalý ořez a otvor smažeme
            if (!jeZcelaUvnitr) {
                if (protinajiciPlusPoly && protinajiciFormatPlus) {
                    // Fyzické odečtení hmoty na rozhraní
                    const vysledekOrezu = polygonClipping.difference(protinajiciFormatPlus, [formatMinus]);

                    if (vysledekOrezu.length === 0) {
                        // Kdyby uživatel roztáhl mínus do takových rozměrů, že by spolkl celý kladný polygon
                        const indexPlus = this.polygony.findIndex(p => p.id === protinajiciPlusPoly!.id);
                        if (indexPlus !== -1) this.polygony.splice(indexPlus, 1);
                    } else {
                        // Aplikování vykousnutého tvaru zpět
                        for (let k = 0; k < vysledekOrezu.length; k++) {
                            const polygonZastupce = vysledekOrezu[k]!;
                            const vnejsiHranice = polygonZastupce[0]!;
                            
                            const noveX = vnejsiHranice.map(p => p[0]);
                            const noveY = vnejsiHranice.map(p => p[1]);

                            if (k === 0) {
                                protinajiciPlusPoly.update(noveX, noveY, true, protinajiciPlusPoly.ro, protinajiciPlusPoly.E);
                            } else {
                                this.polygony.push(new Polygon(noveX, noveY, true, protinajiciPlusPoly.ro, protinajiciPlusPoly.E));
                            }

                            // Zachování případných nových děr vzniklých složitým ořezem (třeba spojení U-profilu)
                            for (let h = 1; h < polygonZastupce.length; h++) {
                                const diraHranice = polygonZastupce[h]!;
                                const diraX = diraHranice.map(p => p[0]);
                                const diraY = diraHranice.map(p => p[1]);
                                this.polygony.push(new Polygon(diraX, diraY, false, protinajiciPlusPoly.ro, protinajiciPlusPoly.E));
                            }
                        }
                    }
                }

                // Jelikož otvor vykonal své dílo (vykousl okraj) nebo byl vytažen zcela do prázdna,
                // jako samostatná entita zaniká.
                const aktualniIndex = this.polygony.findIndex(p => p.id === polygon.id);
                if (aktualniIndex !== -1) {
                    this.polygony.splice(aktualniIndex, 1);
                }
            }
        }

        // 5. Následná aktualizace veškerých průsečíků a linek
        this.aktualizujPruseciky();
    }

    // --- POMOCNÁ METODA PRO VÝPOČET NÁHRADNÍCH SIL ---
    // Změněno: odstraněno "export function", nyní je to běžná metoda třídy
    prevodZatizeniNaSily(zatizeni: ZadaniZatizeni[]) {
        let Fz_celk = 0;
        let Mx_celk = 0;
        let My_celk = 0;

        for (const z of zatizeni) {
            const pocetBodu = z.x_val.length;
            
            // Převod souřadnic z mm na metry pro fyzikální výpočet
            const x_m = z.x_val.map(x => x / 1000);
            const y_m = z.y_val.map(y => y / 1000);

            if (pocetBodu === 1) {
                // A) BODOVÉ ZATÍŽENÍ (1 bod)
                // Přidány vykřičníky pro ujištění TypeScriptu, že hodnota existuje
                const F = z.hodnota;
                Fz_celk += F;
                Mx_celk += F * y_m[0]!;
                My_celk += F * x_m[0]!;
                
            } else if (pocetBodu === 2) {
                // B) LINIOVÉ ZATÍŽENÍ (2 body)
                const dx = x_m[1]! - x_m[0]!;
                const dy = y_m[1]! - y_m[0]!;
                const delka_m = Math.sqrt(dx * dx + dy * dy);
                
                const F = z.hodnota * delka_m;
                const stred_x = (x_m[0]! + x_m[1]!) / 2;
                const stred_y = (y_m[0]! + y_m[1]!) / 2;
                
                Fz_celk += F;
                Mx_celk += F * stred_y;
                My_celk += F * stred_x;
                
            } else if (pocetBodu >= 3) {
                // C) PLOŠNÉ ZATÍŽENÍ (3 a více bodů = polygon)
                let plocha_a_smer = 0;
                let suma_moment_plochy_x_kladne = 0;
                let suma_moment_plochy_x_zaporne = 0;
                let suma_moment_plochy_y_kladne = 0;
                let suma_moment_plochy_y_zaporne = 0;

                for (let i = 0; i < pocetBodu; i++) {
                    const j = (i + 1) % pocetBodu;
                    const x1 = x_m[i]!;
                    const y1 = y_m[i]!;
                    const x2 = x_m[j]!;
                    const y2 = y_m[j]!;

                    const dx = x2 - x1;
                    if (Math.abs(dx) < 1e-12) continue; // Svislá čára netvoří plochu pod vektorem

                    const plocha_pod = plochaPodVektorem(x1, x2, y1, y2);
                    const abs_plocha_pod = Math.abs(plocha_pod);
                    const [xt_pod, yt_pod] = tezistePlochyPodVektorem(x1, x2, y1, y2);
                    
                    // Zásadní oprava: plocha_a_smer se musí sčítat/odečítat přesně podle dx, 
                    // aby to drželo krok s momenty a poznalo to CW / CCW směr zadání.
                    if (dx > 0) {
                        plocha_a_smer += abs_plocha_pod;
                        suma_moment_plochy_x_kladne += abs_plocha_pod * xt_pod;
                        suma_moment_plochy_y_kladne += abs_plocha_pod * yt_pod;
                    } else if (dx < 0) {
                        plocha_a_smer -= abs_plocha_pod;
                        suma_moment_plochy_x_zaporne += abs_plocha_pod * xt_pod;
                        suma_moment_plochy_y_zaporne += abs_plocha_pod * yt_pod;
                    }
                }

                const plocha_abs = Math.abs(plocha_a_smer);
                let teziste_x_m = 0;
                let teziste_y_m = 0;

                // Sloučení těžiště přesně podle tvé definice (funguje obousměrně)
                if (plocha_abs > 1e-12) {
                    if (plocha_a_smer > 0) {
                        teziste_x_m = (suma_moment_plochy_x_kladne - suma_moment_plochy_x_zaporne) / plocha_abs;
                        teziste_y_m = (suma_moment_plochy_y_kladne - suma_moment_plochy_y_zaporne) / plocha_abs;
                    } else {
                        teziste_x_m = (-suma_moment_plochy_x_kladne + suma_moment_plochy_x_zaporne) / plocha_abs;
                        teziste_y_m = (-suma_moment_plochy_y_kladne + suma_moment_plochy_y_zaporne) / plocha_abs;
                    }
                }

                const F = z.hodnota * plocha_abs; 
                
                Fz_celk += F;
                Mx_celk += F * teziste_y_m;
                My_celk += F * teziste_x_m;
            }
        }

        return { Fz: Fz_celk, Mx: Mx_celk, My: My_celk };
    }

    // --- HLAVNÍ METODA PRO VÝPOČET ROVNICE ROVINY NAPĚTÍ ---
    spocitejRovniceNapeti(zatizeni: ZadaniZatizeni[]): SouhrnRovnicNapeti {
        const sily = this.prevodZatizeniNaSily(zatizeni);
        const celk = this.spocitejCelkove();

        // Příprava konstant pro Navierův vzorec (v metrech)
        const A_m2 = celk.vysledna_plocha_id * 1e-6;
        const Ix_m4 = celk.vysledny_moment_x * 1e-12;
        const Iy_m4 = celk.vysledny_moment_y * 1e-12;
        const Dxy_m4 = celk.vysledny_dev_moment * 1e-12;
        const xt_m = celk.teziste_x * 1e-3;
        const yt_m = celk.teziste_y * 1e-3;
        const N = sily.Fz;
        const Mx_t = sily.Mx - N * yt_m;
        const My_t = sily.My - N * xt_m;
        const jmenovatel = (Ix_m4 * Iy_m4) - (Dxy_m4 * Dxy_m4);

        if (Math.abs(jmenovatel) < 1e-40) {
            throw new Error("Geometrie má nulovou nebo neplatnou tuhost.");
        }

        const E_ref = this.zvolene_E_ref ?? Math.max(...this.polygony.map(p => p.E));

        const a_ref = (My_t * Ix_m4 - Mx_t * Dxy_m4) / jmenovatel; 
        const b_ref = (Mx_t * Iy_m4 - My_t * Dxy_m4) / jmenovatel; 

        // GLOBÁLNÍ PROMĚNNÉ PRO NEUTRÁLNÍ OSU
        let global_smernice_np: Smernice | undefined = undefined;
        let global_a_null: number | undefined = undefined;
        let global_b_null: number | undefined = undefined;
        let global_x_null: number | undefined = undefined;

        const rovnice = this.polygony.map((poly, index) => {
            const body = poly.x_val.slice(0, 3).map((x, i) => ({ 
                x: x / 1000, 
                y: poly.y_val[i]! / 1000 
            }));
            
            const sigma = body.map(b => {
                const n = poly.E / E_ref;
                const sigma_ref = (N / A_m2) + a_ref * (b.x - xt_m) + b_ref * (b.y - yt_m);
                return sigma_ref * n;
            });

            const det = body[0]!.x * (body[1]!.y - body[2]!.y) +
                        body[1]!.x * (body[2]!.y - body[0]!.y) +
                        body[2]!.x * (body[0]!.y - body[1]!.y);

            const detA = sigma[0]! * (body[1]!.y - body[2]!.y) +
                         sigma[1]! * (body[2]!.y - body[0]!.y) +
                         sigma[2]! * (body[0]!.y - body[1]!.y);

            const detB = body[0]!.x * (sigma[1]! - sigma[2]!) +
                         body[1]!.x * (sigma[2]! - sigma[0]!) +
                         body[2]!.x * (sigma[0]! - sigma[1]!);

            const detC = body[0]!.x * (body[1]!.y * sigma[2]! - body[2]!.y * sigma[1]!) +
                         body[1]!.x * (body[2]!.y * sigma[0]! - body[0]!.y * sigma[2]!) +
                         body[2]!.x * (body[0]!.y * sigma[1]! - body[1]!.y * sigma[0]!);

            const a = detA / det;
            const b = detB / det;
            const c = detC / det;

            const a_plane_mm = a / 1000;
            const b_plane_mm = b / 1000;
            const c_plane = c;

            // --- VÝPOČET NEUTRÁLNÍ OSY POUZE Z PRVNÍHO POLYGONU ---
            if (index === 0) {
                if (Math.abs(a_plane_mm) > 1e-9 || Math.abs(b_plane_mm) > 1e-9) {
                    let x1, y1, x2, y2;
                    
                    if (Math.abs(a_plane_mm) > 1e-9) {
                        y1 = 0;
                        x1 = -(b_plane_mm * y1 + c_plane) / a_plane_mm;
                        y2 = 100;
                        x2 = -(b_plane_mm * y2 + c_plane) / a_plane_mm;
                    } else {
                        x1 = 0;
                        y1 = -(a_plane_mm * x1 + c_plane) / b_plane_mm;
                        x2 = 100;
                        y2 = -(a_plane_mm * x2 + c_plane) / b_plane_mm;
                    }

                    if (Math.abs(x1 - x2) < 1e-9) {
                        global_smernice_np = { typ: "svisla", x: x1 };
                        global_x_null = x1;
                    } else {
                        const line_a = (y1 - y2) / (x1 - x2);
                        const line_b = y1 - line_a * x1;
                        global_smernice_np = { typ: "klasicka", a: line_a, b: line_b };
                        global_a_null = line_a;
                        global_b_null = line_b;
                    }
                }
            }

            // --- VÝPOČET PRŮSEČÍKŮ S HRANAMI POLYGONU ---
            const pruseciky_x_arr: number[] = [];
            
            // Průsečíky počítáme jen pokud neutrální přímka existuje
            if (global_smernice_np && poly.vysledky) {
                const eps = 1e-7;
                const smernice_hran = poly.vysledky.smernice;
                
                for (let i = 0; i < smernice_hran.length; i++) {
                    const s_hrana = smernice_hran[i]!;
                    const vx1 = poly.x_val[i]!;
                    const vy1 = poly.y_val[i]!;
                    const vx2 = poly.x_val[i + 1]!;
                    const vy2 = poly.y_val[i + 1]!;

                    let px: number | null = null;
                    let py: number | null = null;

                    if (global_smernice_np.typ === "svisla" && s_hrana.typ === "svisla") {
                        continue; 
                    } else if (global_smernice_np.typ === "svisla" && s_hrana.typ === "klasicka") {
                        px = global_smernice_np.x;
                        py = s_hrana.a * px + s_hrana.b;
                    } else if (global_smernice_np.typ === "klasicka" && s_hrana.typ === "svisla") {
                        px = s_hrana.x;
                        py = global_smernice_np.a * px + global_smernice_np.b;
                    } else if (global_smernice_np.typ === "klasicka" && s_hrana.typ === "klasicka") {
                        if (Math.abs(global_smernice_np.a - s_hrana.a) < eps) continue; 
                        px = (s_hrana.b - global_smernice_np.b) / (global_smernice_np.a - s_hrana.a);
                        py = global_smernice_np.a * px + global_smernice_np.b;
                    }

                    if (px !== null && py !== null) {
                        const minX = Math.min(vx1, vx2) - eps;
                        const maxX = Math.max(vx1, vx2) + eps;
                        const minY = Math.min(vy1, vy2) - eps;
                        const maxY = Math.max(vy1, vy2) + eps;

                        if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
                            if (!pruseciky_x_arr.some(existX => Math.abs(existX - px!) < eps)) {
                                pruseciky_x_arr.push(px);
                            }
                        }
                    }
                }
                pruseciky_x_arr.sort((val1, val2) => val1 - val2);
            }

            return {
                polygon_id: poly.id,
                a_plane: a_plane_mm,
                b_plane: b_plane_mm,
                c_plane: c_plane,
                rovnice_text: `z = ${a_plane_mm.toExponential(4)}*x_mm + ${b_plane_mm.toExponential(4)}*y_mm + ${c_plane.toExponential(4)}`,
                ...(pruseciky_x_arr.length > 0 ? { pruseciky_x: pruseciky_x_arr } : {})
            };
        });

        // Návrat celého objektu (rovnice + globální parametry)
        return {
            rovnice,
            ...(global_a_null !== undefined ? { a_null_line: global_a_null } : {}),
            ...(global_b_null !== undefined ? { b_null_line: global_b_null } : {}),
            ...(global_x_null !== undefined ? { x_null_line: global_x_null } : {})
        };
    }
}





