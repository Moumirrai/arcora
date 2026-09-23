import polygonClipping from 'polygon-clipping';

interface SnapshotPoly {
    id: string;
    kladne: boolean;
    ro: number;
    E: number;
    vrcholy: Array<{ id: string; x: number; y: number }>;
}

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

// Sloučí vrcholy se stejnými souřadnicemi v rámci jednoho ringu.
// Používá se po boolean operacích - polygon-clipping občas vrací ringy
// s duplikovanými body (dva vrcholy na sobě). Tolerance je 1e-6 mm,
// což je hluboko pod praktickou přesností, ale dost na numerický šum.
function deduplikujVrcholy(x: number[], y: number[]): { x: number[]; y: number[] } {
    const seen = new Set<string>();
    const nx: number[] = [];
    const ny: number[] = [];
    for (let i = 0; i < x.length; i++) {
        const key = `${Math.round(x[i]! * 1e6)},${Math.round(y[i]! * 1e6)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        nx.push(x[i]!);
        ny.push(y[i]!);
    }
    return { x: nx, y: ny };
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

    // Metoda pro export do čistého datového objektu 
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
        
        // Deduplikace vrcholů (odstraní body na sobě, které mohou vzniknout
        // po boolean operacích v polygon-clipping)
        const { x: xd, y: yd } = deduplikujVrcholy(x_values, y_values);

        this.vrcholy = [];
        for (let i = 0; i < xd.length; i++) {
            this.vrcholy.push(new Vrchol(this.id, xd[i]!, yd[i]!));
        }

        this.vypocet();
    }

    update(x_values: number[], y_values: number[], kladne: boolean, ro: number, E: number): void {
        this.kladne = kladne;
        this.ro = ro;
        this.E = E;
        
        // Stejná deduplikace jako v konstruktoru
        const { x: xd, y: yd } = deduplikujVrcholy(x_values, y_values);

        this.vrcholy = [];
        for (let i = 0; i < xd.length; i++) {
            this.vrcholy.push(new Vrchol(this.id, xd[i]!, yd[i]!));
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

    private editSession: {
        idTvaru: string;
        idVrcholu: string;
        snapshot: SnapshotPoly[];
    } | null = null;

    // Detekuje geometrické kolize:
    //   1) self-intersection u jakéhokoli polygonu (i záporného),
    //   2) průsečíky hran mezi kladnými polygony (kříž, částečný překryv),
    //   3) průsečíky hran kladný ↔ záporný (spike kladného do otvoru),
    //   4) plné pohlcení: vnitřní polygon musí být CELÝ uvnitř některého
    //      negativu, aby to byl legitimní ostrůvek. Jinak je to kolize.
    public detekujKolize(): boolean {
        // 1) Self-intersection u všech polygonů
        for (const P of this.polygony) {
            if (this.polygonSeProtinaSamSeSobou(P)) return true;
        }

        const kladne = this.polygony.filter(p => p.kladne);
        const zaporny = this.polygony.filter(p => !p.kladne);

        const rings = kladne.map(p =>
            p.x_val.map((x, k) => [x, p.y_val[k]!] as [number, number])
        );
        const negRings = zaporny.map(p =>
            p.x_val.map((x, k) => [x, p.y_val[k]!] as [number, number])
        );

        // 2) Průsečíky hran mezi kladnými polygony
        for (let i = 0; i < kladne.length; i++) {
            const ringA = rings[i]!;
            const edgesA = ringA.length - 1;
            for (let j = i + 1; j < kladne.length; j++) {
                const ringB = rings[j]!;
                const edgesB = ringB.length - 1;
                if (this.ringsSeKrizi(ringA, edgesA, ringB, edgesB)) return true;

                // 4) Plné pohlcení
                const aInB = this.ringUvnitrRingu(ringA, ringB);
                const bInA = this.ringUvnitrRingu(ringB, ringA);

                if (aInB || bInA) {
                    const innerRing = aInB ? ringA : ringB;
                    // Legitimní ostrůvek = vnitřní polygon CELÝ uvnitř některého negativu
                    const uvnitrDira = negRings.some(hr => this.ringUvnitrRingu(innerRing, hr));
                    if (!uvnitrDira) return true;
                } else {
                    // Fallback: částečný překryv bez detekovaného hranového průsečíku
                    // (numerické případy u velmi úzkých překryvů)
                    const inter = polygonClipping.intersection([ringA], [ringB]);
                    if (inter.length > 0) {
                        const interArea = inter.reduce(
                            (s, poly) => s + plochaRingu(poly[0] as any),
                            0
                        );
                        if (interArea > 1e-3) return true;
                    }
                }
            }
        }

        // 3) Průsečíky hran kladný ↔ záporný (spike rodiče do vlastní díry).
        //    Testujeme POUZE když negativ N leží uvnitř pozitivu P – to jsou
        //    díry patřící P, kde vniknutí hrany P do N je chyba.
        //    Pokud je naopak P uvnitř N (ostrůvek v cizí díře), kontakt
        //    přeskočíme – materiál ostrůvku legitimně vyplňuje díru a jeho
        //    hrana se s hranou díry může setkat, aniž by to byla kolize.
        for (let i = 0; i < kladne.length; i++) {
            const ringP = rings[i]!;
            const edgesP = ringP.length - 1;
            for (let j = 0; j < zaporny.length; j++) {
                const ringN = negRings[j]!;
                const edgesN = ringN.length - 1;
                // N musí být uvnitř P, aby šlo o díru patřící P
                if (!this.ringUvnitrRingu(ringN, ringP)) continue;
                if (this.ringsSeKrizi(ringP, edgesP, ringN, edgesN)) return true;
            }
        }

        return false;
    }

    // Pomocná: test, zda se jakákoli hrana ringu A protíná s jakoukoli hranou ringu B.
    private ringsSeKrizi(
        ringA: polygonClipping.Ring,
        edgesA: number,
        ringB: polygonClipping.Ring,
        edgesB: number
    ): boolean {
        for (let a = 0; a < edgesA; a++) {
            const a1 = ringA[a]!, a2 = ringA[a + 1]!;
            for (let b = 0; b < edgesB; b++) {
                const b1 = ringB[b]!, b2 = ringB[b + 1]!;
                if (this.segmentySeKrizi(
                    a1[0], a1[1], a2[0], a2[1],
                    b1[0], b1[1], b2[0], b2[1]
                )) return true;
            }
        }
        return false;
    }

    // Všechny vrcholy vnitřního ringu musí ležet uvnitř vnějšího ringu.
    private ringUvnitrRingu(inner: polygonClipping.Ring, outer: polygonClipping.Ring): boolean {
        for (const pt of inner) {
            if (!this.pointInRing(pt[0], pt[1], outer as any)) return false;
        }
        return true;
    }

    // Vrací true, pokud polygon p (musí být kladný) obsahuje nějaký záporný
    // polygon ze stejného materiálu. Tedy je "rodičem děr" a musí být při
    // merge aplikován PŘED nimi. Pro kladný polygon, který žádnou díru
    // neobsahuje (je to samostatné "přidání" materiálu), vrací false.
    private jeRodicemDer(p: Polygon, allPolys: Polygon[]): boolean {
        if (!p.kladne) return false;
        const pRing = p.x_val.map((x, i) => [x, p.y_val[i]!] as [number, number]);
        for (const q of allPolys) {
            if (q.kladne || q === p) continue;
            const qRing = q.x_val.map((x, i) => [x, q.y_val[i]!] as [number, number]);
            if (this.ringUvnitrRingu(qRing, pRing)) return true;
        }
        return false;
    }

    // Spočítá pořadí, v jakém se mají polygony stejného materiálu aplikovat
    // při merge (union pro pozitiv, difference pro negativ).
    //
    // Klíčová myšlenka: aktivně editovaný polygon a všechny jeho "potomky"
    // (polygony, které leží uvnitř něj - rekurzivně) tvoří tzv. PODSTROM,
    // který se aplikuje jako celek až na konci. Uvnitř podstromu jde
    // editovaný polygon první a jeho potomci po něm (podle hloubky).
    //
    // Proč to řeší konflikt:
    //   - Editovaný otvor H1 prořízne cizí ostrůvek N2 (N2 je v "zbytku",
    //     aplikuje se před podstromem H1 → H1 ho řeže).
    //   - Editovaný otvor H1 ponechá svůj vlastní ostrůvek N1 (N1 je
    //     v podstromu H1, aplikuje se po H1 → zůstane).
    //   - Standalone kladný P2 (žádný podstrom) jde na konec → vyplní cizí
    //     díru H1.
    //   - Rodič P1 se posunem nestane "non-rodičem" - podstrom H1 se
    //     aplikuje po P1, protože P1 je v "zbytku" s hloubkou 0.
    private computeApplicationOrder(sameMat: Polygon[]): Polygon[] {
        const snap = this.editSession?.snapshot ?? [];
        const snapMap = new Map(snap.map(s => [s.id, s]));
        const editedId = this.editSession?.idTvaru;

        const edited = editedId ? sameMat.find(p => p.id === editedId) : undefined;
        if (!edited) {
            // Fallback: jen podle hloubky
            return this.sortByDepthInSnapshot(sameMat, snap, snapMap);
        }

        // 1) Najdi celý podstrom editovaného polygonu (edited + rekurzivně
        //    vše, co leží uvnitř něj). Používáme snapshot, ne aktuální stav,
        //    aby se během dragu podstrom "nerozpadl", když se hrana dočasně
        //    posune mimo potomka.
        const subtreeIds = new Set<string>([edited.id]);
        const queue: string[] = [edited.id];
        while (queue.length > 0) {
            const curId = queue.shift()!;
            const curSnap = snapMap.get(curId);
            if (!curSnap) continue;
            const curRing: [number, number][] = curSnap.vrcholy.map(v => [v.x, v.y]);
            for (const s of snap) {
                if (subtreeIds.has(s.id)) continue;
                const sRing: [number, number][] = s.vrcholy.map(v => [v.x, v.y]);
                if (this.ringUvnitrRingu(sRing, curRing)) {
                    subtreeIds.add(s.id);
                    queue.push(s.id);
                }
            }
        }

        // 2) Rozdělit na podstrom a zbytek
        const subtree = sameMat.filter(p => subtreeIds.has(p.id));
        const zbytek = sameMat.filter(p => !subtreeIds.has(p.id));

        // 3) Zbytek: vnější první (podle hloubky v snapshotu)
        const zbytekSorted = this.sortByDepthInSnapshot(zbytek, snap, snapMap);

        // 4) Podstrom: editovaný první, jeho děti po něm (podle hloubky)
        const subtreeSorted = this.sortByDepthInSnapshot(subtree, snap, snapMap);

        return [...zbytekSorted, ...subtreeSorted];
    }

        // Vrátí množinu ID všech polygonů v podstromu aktuálně editovaného polygonu
    // (editovaný + rekurzivně vše, co v snapshotu leží uvnitř něj).
    // Používá se pro klipování pozitivních potomků hranicí editovaného polygonu.
    private computeSubtreeIdsFromSnapshot(): Set<string> {
        const snap = this.editSession?.snapshot ?? [];
        const snapMap = new Map(snap.map(s => [s.id, s]));
        const editedId = this.editSession?.idTvaru;
        const result = new Set<string>();
        if (!editedId || !snapMap.has(editedId)) return result;
        result.add(editedId);
        const queue: string[] = [editedId];
        while (queue.length > 0) {
            const curId = queue.shift()!;
            const curSnap = snapMap.get(curId);
            if (!curSnap) continue;
            const curRing: [number, number][] = curSnap.vrcholy.map(v => [v.x, v.y]);
            for (const s of snap) {
                if (result.has(s.id)) continue;
                const sRing: [number, number][] = s.vrcholy.map(v => [v.x, v.y]);
                if (this.ringUvnitrRingu(sRing, curRing)) {
                    result.add(s.id);
                    queue.push(s.id);
                }
            }
        }
        return result;
    }

    // Seřadí polygony podle hloubky vnoření v SNAPSHOTU (ne v aktuálním stavu).
    // Vnější tvary první. Při shodě hloubky rozhoduje původní pořadí v poli.
    private sortByDepthInSnapshot(
        polys: Polygon[],
        snap: SnapshotPoly[],
        snapMap: Map<string, SnapshotPoly>
    ): Polygon[] {
        if (polys.length <= 1) return polys;
        const depths = polys.map(p => {
            const sp = snapMap.get(p.id);
            if (!sp) return 0;
            const pRing: [number, number][] = sp.vrcholy.map(v => [v.x, v.y]);
            let d = 0;
            for (const s of snap) {
                if (s.id === p.id) continue;
                const sRing: [number, number][] = s.vrcholy.map(v => [v.x, v.y]);
                if (this.ringUvnitrRingu(pRing, sRing)) d++;
            }
            return d;
        });
        const idx = polys.map((_, i) => i);
        idx.sort((a, b) => {
            if (depths[a] !== depths[b]) return depths[a]! - depths[b]!;
            return a - b;
        });
        return idx.map(i => polys[i]!);
    }

    // Real-time editace vrcholu s automatickým merge.
    //
    // - Pracuje vždy od SNAPSHOTU (stav na začátku editace).
    // - ID polí/vertexů ze snapshotu se během celé editace NEMĚNÍ.
    // - Pořadí aplikace je dané computeApplicationOrder (hloubka vnoření).
    // - Merge běží vždy, když je ve sameMat alespoň 2 polygony: i když se
    //   právě nedotýkají, je potřeba re-dekompozice, aby se odstranil
    //   případný osiřelý negativ (typicky díra, která se posunem rodiče
    //   dostala mimo rodiče).
    public pohnVrcholem(_idTvaru: string, _idVrcholu: string, x: number, y: number): {
        bowtie: boolean;
        blocked: boolean;
        newIdTvaru?: string;
        newIdVrcholu?: string;
    } {
        if (!this.editSession) {
            const idx = this.polygony.findIndex(p => p.id === _idTvaru);
            if (idx === -1) return { bowtie: false, blocked: false };
            const poly = this.polygony[idx]!;
            const v = poly.vrcholy.find(vv => vv.id === _idVrcholu);
            if (!v) return { bowtie: false, blocked: false };
            v.x = x; v.y = y;
            poly.vypocet();
            this.aktualizujPruseciky();
            return { bowtie: false, blocked: false };
        }

        // 1) Vrátit snapshot
        this.obnovSnapshot();

        // 2) Najít polygon a vrchol podle ORIGINÁLNÍCH ID z editSession
        const poly = this.polygony.find(p => p.id === this.editSession!.idTvaru);
        if (!poly) return { bowtie: false, blocked: false };
        const vrch = poly.vrcholy.find(v => v.id === this.editSession!.idVrcholu);
        if (!vrch) return { bowtie: false, blocked: false };

        const origX = vrch.x;
        const origY = vrch.y;

        // 3) Dočasně posunout
        vrch.x = x;
        vrch.y = y;

        // 4) Přepočet polygonu s dočasnou pozicí.
        //    Kontrolu degenerace (dva vrcholy na sobě) děláme až při commitu
        //    v zkusMergeVrcholy(). Během dragu chceme uživateli dovolit dovést
        //    vrchol A přesně na vrchol B, aby se pak mohl sloučit.
        poly.vypocet();

        // 5) Bowtie
        if (this.polygonSeProtinaSamSeSobou(poly)) {
            this.aktualizujPruseciky();
            return { bowtie: true, blocked: false };
        }

        // 6) Merge se stejnými materiály
        const E = poly.E;
        const ro = poly.ro;
        const sameMat = this.polygony.filter(p => p.E === E && p.ro === ro);
        const others = this.polygony.filter(p => p.E !== E || p.ro !== ro);

        if (sameMat.length >= 2) {
            const orderedSameMat = this.computeApplicationOrder(sameMat);
            const subtreeIds = this.computeSubtreeIdsFromSnapshot();
            const editedId = this.editSession!.idTvaru;

            // Klipování: pokud je editovaný polygon pozitivní, klipujeme všechny
            // jeho pozitivní potomky (ostrůvky) jeho aktuální hranicí. Tím se
            // ostrůvky zmenšují / mizí, když hrana vnějšího polygonu přejede přes ně.
            const editedPoly = this.polygony.find(p => p.id === editedId);
            const editedRing: [number, number][] | null =
                (editedPoly && editedPoly.kladne)
                    ? editedPoly.x_val.map((xx, i) => [xx, editedPoly.y_val[i]!] as [number, number])
                    : null;

            let merged: polygonClipping.MultiPolygon = [];
            for (const p of orderedSameMat) {
                const ring: [number, number][] = p.x_val.map((xx, i) => [xx, p.y_val[i]!] as [number, number]);

                if (editedRing && p.kladne && p.id !== editedId && subtreeIds.has(p.id)) {
                    // Pozitivní potomek editovaného pozitivu → ořezat hranicí.
                    const pieces = polygonClipping.intersection([ring], [editedRing]);
                    for (const piece of pieces) {
                        merged = polygonClipping.union(merged, [piece]);
                    }
                } else if (p.kladne) {
                    merged = polygonClipping.union(merged, [ring]);
                } else {
                    merged = polygonClipping.difference(merged, [ring]);
                }
            }
            merged = vycistiMultiPolygon(merged);

            const newPolys: Polygon[] = [];
            for (const part of merged) {
                const outer = part[0]!;
                newPolys.push(new Polygon(outer.map(p => p[0]), outer.map(p => p[1]), true, ro, E));
                for (let h = 1; h < part.length; h++) {
                    const hole = part[h]!;
                    newPolys.push(new Polygon(hole.map(p => p[0]), hole.map(p => p[1]), false, ro, E));
                }
            }
            const sorted = this.sortByDepth(newPolys);
            this.polygony = [...others, ...sorted];
        }

        const blizky = this.najdiVrcholBlizko(x, y, 1e-3);

        this.aktualizujPruseciky();
        return {
            bowtie: false,
            blocked: false,
            ...(blizky ? { newIdTvaru: blizky.idTvaru, newIdVrcholu: blizky.idVrcholu } : {}),
        };
    }

    // Robustní test průsečíku dvou úseček.
    //
    // Místo cross-product porovnávání (d1>0 && d2<0 && …) používáme parametrické
    // vyjádření: spočítáme průsečík přímek, na kterých úsečky leží, a ověříme,
    // že leží STRIKTNĚ uvnitř obou úseček (s tolerancí od konců).
    //
    // Původní cross-product test selhával u téměř rovnoběžných hran, kde se
    // znaménka d1..d4 překlápěla podle floating-point šumu – výsledkem byly
    // falešné poplachy, které zmizely při nepatrném posunu vrcholu.
    private segmentySeKrizi(
        ax1: number, ay1: number, ax2: number, ay2: number,
        bx1: number, by1: number, bx2: number, by2: number
    ): boolean {
        const dxA = ax2 - ax1, dyA = ay2 - ay1;
        const dxB = bx2 - bx1, dyB = by2 - by1;

        // Rovnoběžné (nebo prakticky rovnoběžné) úsečky → žádný průsečík
        const denom = dxA * dyB - dyA * dxB;
        const scale = Math.max(
            Math.abs(dxA), Math.abs(dyA),
            Math.abs(dxB), Math.abs(dyB),
            1
        );
        if (Math.abs(denom) < 1e-10 * scale * scale) return false;

        // Parametry průsečíku na obou úsečkách (t pro A, u pro B)
        const t = ((bx1 - ax1) * dyB - (by1 - ay1) * dxB) / denom;
        const u = ((bx1 - ax1) * dyA - (by1 - ay1) * dxA) / denom;

        // Vyžadujeme striktně vnitřní průsečík. Tím se za kolizi nepočítají
        // hrany, které se pouze dotýkají vrcholem (typicky po merge, kde spolu
        // dvě hrany sousedí), ani hrany, které sdílí celou úsečku (kolineární).
        const eps = 1e-6;
        return t > eps && t < 1 - eps && u > eps && u < 1 - eps;
    }

    // Self-intersection jednoho polygonu (libovolného, i záporného).
    private polygonSeProtinaSamSeSobou(P: Polygon): boolean {
        const xs = P.x_val;
        const ys = P.y_val;
        const nEdges = xs.length - 1;
        if (nEdges < 4) return false;
        for (let a = 0; a < nEdges; a++) {
            const a1x = xs[a]!, a1y = ys[a]!;
            const a2x = xs[a + 1]!, a2y = ys[a + 1]!;
            for (let b = a + 1; b < nEdges; b++) {
                if (b === a + 1) continue;                 // sousedící hrana
                if (a === 0 && b === nEdges - 1) continue; // první a poslední
                const b1x = xs[b]!, b1y = ys[b]!;
                const b2x = xs[b + 1]!, b2y = ys[b + 1]!;
                if (this.segmentySeKrizi(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Vrací true, pokud bod (px, py) leží na úsečce (ax, ay) - (bx, by).
    private bodNaUsecke(px: number, py: number, ax: number, ay: number, bx: number, by: number): boolean {
        const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
        if (Math.abs(cross) > 1e-9) return false;
        const minX = Math.min(ax, bx) - 1e-9;
        const maxX = Math.max(ax, bx) + 1e-9;
        const minY = Math.min(ay, by) - 1e-9;
        const maxY = Math.max(ay, by) + 1e-9;
        return px >= minX && px <= maxX && py >= minY && py <= maxY;
    }

    private cross(ax: number, ay: number, bx: number, by: number): number {
        return ax * by - ay * bx;
    }

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

    // Uloží snapshot všech polygonů (včetně ID vrcholů), aby se dal stav
    // kdykoli vrátit. Používá se při editaci vrcholu pro real-time merge
    // a pro Esc (návrat do původního stavu).
    //
    // POZOR: `Polygon.vypocet()` na konec `vrcholy` přidává referenci na první
    // vrchol (uzavírací bod). Kdybychom ho uložili i do snapshotu jako samostatný
    // záznam, po obnově by vznikl druhý objekt se stejným ID – v UI by se
    // vykresloval jako "druhý kruh" na stejné pozici a při tažení by se vrchol
    // rozpadl na dva. Proto snapshot ukládá pouze unikátní vrcholy (bez
    // uzavíracího bodu). Uzavírací referenci si `vypocet()` přidá sám při obnově.
    public zacniEditaci(idTvaru: string, idVrcholu: string): void {
        const snapshot: SnapshotPoly[] = this.polygony.map(p => {
            const unikatni: { id: string; x: number; y: number }[] = [];
            const seen = new Set<string>();
            for (const v of p.vrcholy) {
                if (seen.has(v.id)) continue;
                seen.add(v.id);
                unikatni.push({ id: v.id, x: v.x, y: v.y });
            }
            return {
                id: p.id,
                kladne: p.kladne,
                ro: p.ro,
                E: p.E,
                vrcholy: unikatni,
            };
        });
        this.editSession = { idTvaru, idVrcholu, snapshot };
    }

    // Potvrdí editaci: pouze zapomene snapshot, aktuální stav polygonů zůstává.
    public potvrdEditaci(): void {
        this.editSession = null;
    }

    // Vrátí seznam vrcholů pro snap na jiný vrchol.
    // - Během editace vrcholu: vrací vrcholy ze SNAPSHOTU (originální pozice
    //   na začátku editace). Vynechává aktivně editovaný vrchol. Tím je
    //   snap stabilní - nesnapuje na pozice z post-merge stavu, který se
    //   každý frame mění.
    // - Mimo editaci: vrací vrcholy z aktuálního stavu (bez uzavíracích duplikátů).
    public getSnapCandidates(): Array<{ idTvaru: string; idVrcholu: string; x: number; y: number }> {
        const result: Array<{ idTvaru: string; idVrcholu: string; x: number; y: number }> = [];

        if (this.editSession) {
            const excludeId = this.editSession.idVrcholu;
            for (const s of this.editSession.snapshot) {
                for (const v of s.vrcholy) {
                    if (v.id === excludeId) continue;
                    result.push({ idTvaru: s.id, idVrcholu: v.id, x: v.x, y: v.y });
                }
            }
        } else {
            for (const p of this.polygony) {
                const n = p.vrcholy.length;
                const cnt = (n >= 2 && p.vrcholy[0] === p.vrcholy[n - 1]) ? n - 1 : n;
                for (let i = 0; i < cnt; i++) {
                    const v = p.vrcholy[i]!;
                    result.push({ idTvaru: p.id, idVrcholu: v.id, x: v.x, y: v.y });
                }
            }
        }
        return result;
    }

    // Zruší editaci: vrátí polygony do stavu ze snapshotu.
    public zrusEditaci(): void {
        if (!this.editSession) return;
        this.obnovSnapshot();
        this.editSession = null;
        this.aktualizujPruseciky();
    }

    private obnovSnapshot(): void {
        if (!this.editSession) return;
        this.polygony = this.editSession.snapshot.map(s => {
            // Vytvoříme polygon s dummy vrcholy, které projdou konstruktorem (3 body),
            // a vzápětí přepíšeme vrcholy těmi ze snapshotu (i s jejich ID).
            const p = new Polygon([0, 0, 1], [0, 1, 0], s.kladne, s.ro, s.E, s.id);
            p.vrcholy = s.vrcholy.map(v => new Vrchol(s.id, v.x, v.y, v.id));
            p.vypocet();
            return p;
        });
    }



    private najdiVrcholBlizko(x: number, y: number, tolerance: number): { idTvaru: string; idVrcholu: string } | null {
        for (const p of this.polygony) {
            const vrcholy = p.vrcholy;
            const n = (vrcholy.length >= 2 && vrcholy[0] === vrcholy[vrcholy.length - 1])
                ? vrcholy.length - 1
                : vrcholy.length;
            for (let i = 0; i < n; i++) {
                const v = vrcholy[i]!;
                if (Math.abs(v.x - x) < tolerance && Math.abs(v.y - y) < tolerance) {
                    return { idTvaru: p.id, idVrcholu: v.id };
                }
            }
        }
        return null;
    }



    // Smaže vrchol z polygonu. Vrací true při úspěchu, false když by polygon
    // po smazání měl méně než 3 vrcholy (pak se nic nezmění).
    public smazVrchol(idTvaru: string, idVrcholu: string): boolean {
        const idx = this.polygony.findIndex(p => p.id === idTvaru);
        if (idx === -1) return false;
        const polygon = this.polygony[idx]!;

        // Získáme unikátní vrcholy. `vypocet()` na konec přidává referenci na první
        // vrchol jako uzavírací bod - ten musíme odstranit, abychom nesmazali
        // "první i poslední" zároveň.
        let unikatni = polygon.vrcholy;
        if (unikatni.length >= 2 && unikatni[0] === unikatni[unikatni.length - 1]) {
            unikatni = unikatni.slice(0, -1);
        }

        const vrcholIdx = unikatni.findIndex(v => v.id === idVrcholu);
        if (vrcholIdx === -1) return false;

        const novyVrcholy = unikatni.slice(0, vrcholIdx).concat(unikatni.slice(vrcholIdx + 1));
        if (novyVrcholy.length < 3) return false;

        polygon.vrcholy = novyVrcholy;
        polygon.vypocet();
        this.aktualizujPruseciky();
        return true;
    }

    // Zpracuje přesun vrcholu na pozici jiného vrcholu stejného polygonu:
    //   - sousední vrcholy  → klasický merge (jeden se smaže),
    //   - nesousední vrcholy → rozdělení polygonu na dvě smyčky.
    //     Pokud jedna smyčka leží CELÁ uvnitř druhé (např. C-čko po uzavření),
    //     uloží se menší smyčka jako ZÁPORNÁ (díra) a větší jako kladná.
    //     Tím pádem i rozdělení, které uzavře díru, zůstane validní.
    public zkusMergeVrcholy(
        idTvaru: string,
        idVrcholu: string,
        tolerance = 1e-3
    ): { merged: boolean; survivingId?: string; blocked?: boolean; split?: boolean } {
        const poly = this.polygony.find(p => p.id === idTvaru);
        if (!poly) return { merged: false };

        let unikatni = poly.vrcholy;
        if (unikatni.length >= 2 && unikatni[0] === unikatni[unikatni.length - 1]) {
            unikatni = unikatni.slice(0, -1);
        }

        const idx = unikatni.findIndex(v => v.id === idVrcholu);
        if (idx === -1) return { merged: false };
        const moved = unikatni[idx]!;

        const otherIdx = unikatni.findIndex((v, i) =>
            i !== idx &&
            Math.abs(v.x - moved.x) < tolerance &&
            Math.abs(v.y - moved.y) < tolerance
        );
        if (otherIdx === -1) return { merged: false };

        const n = unikatni.length;
        const sousedni = (idx + 1) % n === otherIdx || (otherIdx + 1) % n === idx;

        // --- A) Sousední → merge ---
        if (sousedni) {
            if (n <= 3) return { merged: false, blocked: true };
            const surviving = unikatni[otherIdx]!;
            poly.vrcholy = unikatni.filter((_, i) => i !== idx);
            poly.vypocet();
            this.aktualizujPruseciky();
            return { merged: true, survivingId: surviving.id };
        }

        // --- B) Nesousední → rozdělení na dvě smyčky ---
        const minI = Math.min(idx, otherIdx);
        const maxI = Math.max(idx, otherIdx);

        const smycka1 = unikatni.slice(minI, maxI + 1).map(v => ({ x: v.x, y: v.y }));
        const smycka2 = [
            ...unikatni.slice(maxI).map(v => ({ x: v.x, y: v.y })),
            ...unikatni.slice(0, minI + 1).map(v => ({ x: v.x, y: v.y }))
        ];

        const dedup1 = deduplikujVrcholy(smycka1.map(v => v.x), smycka1.map(v => v.y));
        const dedup2 = deduplikujVrcholy(smycka2.map(v => v.x), smycka2.map(v => v.y));
        if (dedup1.x.length < 3 || dedup2.x.length < 3) {
            return { merged: false, blocked: true };
        }

        const ring1 = dedup1.x.map((x, i) => [x, dedup1.y[i]!] as [number, number]);
        const ring2 = dedup2.x.map((x, i) => [x, dedup2.y[i]!] as [number, number]);

        const area1 = plochaRingu(ring1);
        const area2 = plochaRingu(ring2);

        // Ověříme, zda jedna smyčka leží celá uvnitř druhé (průnik má plochu
        // rovnou menší z obou). Pokud ano, menší smyčka je díra.
        let jedenUvnitrDruheho = false;
        try {
            const inter = polygonClipping.intersection([ring1], [ring2]);
            const interArea = inter.reduce((s, p) => s + plochaRingu(p[0] as any), 0);
            const eps = 1e-3;
            const mensi = Math.min(area1, area2);
            const vetsi = Math.max(area1, area2);
            // Průnik odpovídá menší smyčce a zároveň se plochy liší (nejsou identické)
            jedenUvnitrDruheho =
                Math.abs(interArea - mensi) < eps &&
                Math.abs(vetsi - mensi) > eps;
        } catch {
            // Kdyby polygon-clipping selhal, radši vrátíme blocked (nic se nezmění)
            return { merged: false, blocked: true };
        }

        // NOVÉ: Pokud jedna smyčka leží celá uvnitř druhé, NEprovádíme split.
        // Polygon zůstane jako "self-touching" ring (dvě smyčky se dotýkají
        // v jednom bodě). Vykreslování přes fill-rule="evenodd" to zobrazí
        // správně (vnější obrys s dírou) a Polygon.vypocet s tím taky počítá
        // správně. Tím se vyhneme problému, kdy po split by vnější polygon
        // a díra sdílely vrchol a při editaci vnějšího polygonu by se díra
        // rozbila.
        if (jedenUvnitrDruheho) {
            poly.vypocet();
            this.aktualizujPruseciky();
            return { merged: true };
        }

        const idxPuvodni = this.polygony.indexOf(poly);
        const others = this.polygony.filter((_, i) => i !== idxPuvodni);

        let novy1: Polygon;
        let novy2: Polygon;
        try {
            // Sem se dostaneme jen když ani jedna smyčka neobsahuje tu druhou
            // (dvě samostatné hmoty) → obě mají stejnou kladnost jako originál.
            novy1 = new Polygon(dedup1.x, dedup1.y, poly.kladne, poly.ro, poly.E);
            novy2 = new Polygon(dedup2.x, dedup2.y, poly.kladne, poly.ro, poly.E);
        } catch {
            return { merged: false, blocked: true };
        }

        this.polygony = [...others, novy1, novy2];
        this.aktualizujPruseciky();
        return { merged: true, split: true };
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






//----------------------------------------------------------------------------------------------------------------------------
//                                      POSTUP TVOŘENÍ PRŮŘEZU Z POLYGONŮ:
//----------------------------------------------------------------------------------------------------------------------------
//
// 1) zpracujNovyTvar(x, y, E, ro, jeToPlus)
//    │
//    ├── 2) current = resolveMaterial(E, ro)
//    │      → přehraje všechny existující polygony tohoto materiálu
//    │        přes union (kladné) a difference (záporné)
//    │      → vrátí MultiPolygon = "jak materiál aktuálně vypadá"
//    │
//    ├── 3) newMaterial = union(current, N)  [pro +]
//    │             nebo difference(current, N)  [pro −]
//    │      → polygon-clipping zařídí geometrii, sám rozhodne,
//    │        jestli vznikly nové kusy, díry, ostrůvky
//    │
//    ├── 4) vycistiMultiPolygon(newMaterial)
//    │      → odstraní numerické slivery
//    │
//    ├── 5) Re-dekompozice: pro každý polygon v MultiPolygonu
//    │      → outer ring = kladný Polygon
//    │      → každý další ring (díra) = záporný Polygon
//    │
//    ├── 6) sortByDepth(newPolys)
//    │      → seřadí tak, aby vnější tvary šly první
//    │
//    └── 7) this.polygony = [...ostatní materiály, ...seřazené nové]