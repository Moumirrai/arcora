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

export interface RovniceNapeti {
    polygon_id: string | number;
    a: number;
    b: number;
    c: number;
    rovnice_text: string;
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

    private vypocet(): void {
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
            throw new Error("Nejdříve zadejte alespoň jeden platný polygon.");
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

        // --- 5. HLAVNÍ ÚHEL NATOČENÍ ---
        const citatel_uhlu = 2 * vysledny_dev_moment;
        const jmenovatel_uhlu = vysledny_moment_x - vysledny_moment_y;
        const alfa_rad = 0.5 * Math.atan2(citatel_uhlu, jmenovatel_uhlu);
        const alfa_deg = alfa_rad * (180 / Math.PI);

        // --- 6. HLAVNÍ MOMENTY SETRVAČNOSTI ---
        const moment_prumer = 0.5 * (vysledny_moment_x + vysledny_moment_y);
        const moment_rozdil = 0.5 * Math.sqrt(Math.pow(vysledny_moment_x - vysledny_moment_y, 2) + 4 * Math.pow(vysledny_dev_moment, 2));
        
        const vysledny_moment_max = moment_prumer + moment_rozdil;
        const vysledny_moment_min = moment_prumer - moment_rozdil;

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
    spocitejRovniceNapeti(zatizeni: ZadaniZatizeni[]): RovniceNapeti[] {
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

        // Kontrola platnosti geometrie
        if (Math.abs(jmenovatel) < 1e-40) {
            throw new Error("Geometrie má nulovou nebo neplatnou tuhost.");
        }

        const E_ref = this.zvolene_E_ref ?? Math.max(...this.polygony.map(p => p.E));

        // Plnohodnotné koeficienty Navierova vzorce pre ohyb 
        const a_ref = (My_t * Ix_m4 - Mx_t * Dxy_m4) / jmenovatel; 
        const b_ref = (Mx_t * Iy_m4 - My_t * Dxy_m4) / jmenovatel; 

        return this.polygony.map(poly => {
            // 1. Získání prvích 3 bodů pro sestavení soustavy (v metrech)
            const body = poly.x_val.slice(0, 3).map((x, i) => ({ 
                x: x / 1000, 
                y: poly.y_val[i]! / 1000 
            }));
            
            // 2. Výpočet přesného napětí v těchto 3 bodích pomocí správného Navierova vzorce
            const sigma = body.map(b => {
                const n = poly.E / E_ref;
                const sigma_ref = (N / A_m2) + a_ref * (b.x - xt_m) + b_ref * (b.y - yt_m);
                return sigma_ref * n;
            });

            // 3. Řešení soustavy 3 rovnic o 3 neznámych (ax + by + c = sigma) pomocí symetrického Cramerovho pravidla
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

            // 4. Prepočet na mm (koeficienty a, b vydelíme 1000, c zústává v Pa)
            const a_mm = a / 1000;
            const b_mm = b / 1000;


            return {
                polygon_id: poly.id,
                a: a_mm,
                b: b_mm,
                c: c,
                rovnice_text: `z = ${a_mm.toExponential(4)}*x_mm + ${b_mm.toExponential(4)}*y_mm + ${c.toExponential(4)}`
            };
        });
    }
}





