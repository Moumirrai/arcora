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
    const Ix = (1/36) * Math.abs(x2 - x1) * Math.abs(y2 - y1) ** 3 
             + Math.abs(x2 - x1) * Math.abs(y2 - y1) * (1/2) * ((Math.abs(y2 - y1) * (1/3) + Math.min(y2, y1)) - tezisteY) ** 2 
             + (1/12) * Math.abs(x2 - x1) * Math.min(y2, y1) ** 3 
             + Math.abs(x2 - x1) * Math.min(y2, y1) * (Math.min(y2, y1) * (1/2) - tezisteY) ** 2;
             
    // Výpočet Iy
    const Iy = (1/36) * Math.abs(x2 - x1) ** 3 * Math.abs(y2 - y1) 
             + Math.abs(x2 - x1) * Math.abs(y2 - y1) * (1/2) * ((Math.abs(x2 - x1) * zlomek + Math.min(x2, x1)) - tezisteX) ** 2 
             + (1/12) * Math.abs(x2 - x1) ** 3 * Math.min(y2, y1) 
             + Math.abs(x2 - x1) * Math.min(y2, y1) * (Math.abs(x2 - x1) * (1/2) + Math.min(x2, x1) - tezisteX) ** 2;
             
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

    const Dxy = znamenkoDevMomentu * (1/72) * Math.abs(x2 - x1) ** 2 * Math.abs(y2 - y1) ** 2 
              + Math.abs(x2 - x1) * Math.abs(y2 - y1) * (1/2) * ((Math.abs(y2 - y1) * (1/3) + Math.min(y2, y1)) - tezisteY) * ((Math.abs(x2 - x1) * zlomek + Math.min(x2, x1)) - tezisteX) 
              + Math.abs(x2 - x1) * Math.min(y2, y1) * (Math.abs(Math.min(y2, y1) * (1/2)) - tezisteY) * ((Math.abs(x2 - x1) * (1/2) + Math.min(x2, x1)) - tezisteX);
              
    return Dxy;
}




//PLOCHA.PY


// 1. Definice typů pro maximální bezpečnost kódu
export type Smernice = 
    | { typ: "klasicka"; a: number; b: number }
    | { typ: "svisla"; x: number };

export interface Bod {
    x: number;
    y: number;
}

// 2. Třída, která nahrazuje výpočetní paměť původního MainWindow
export class SpravceTeles {
    // Globální paměť (ekvivalent tvých self.vsechny_plochy atd.)
    x_values_all: number[][] = [];
    y_values_all: number[][] = [];
    x_values_kladne_all: number[][] = [];
    y_values_kladne_all: number[][] = [];
    
    a_values_all: Smernice[][] = [];
    
    vsechny_plochy: number[] = [];
    vsechny_teziste: Bod[] = [];
    vsechny_momenty_setrvacnosti: [number, number][] = [];
    vsechny_dev_momenty: number[] = [];
    vsechny_hmotnosti: number[] = [];
    ro_all: number[] = [];
    E_all: number[] = [];

    // Hlavní funkce z PLOCHA.PY
    zpracujPolygon(aktualni_x: number[], aktualni_y: number[], znamenko: "+" | "-", ro: number, E: number): void {
        if (aktualni_x.length < 3) {
            throw new Error("Pro výpočet zadejte alespoň 3 body");
        }

        // OPRAVA 1: Přidání vykřičníku (!) říká TypeScriptu, že aktualni_x[0] určitě existuje.
        // Zároveň explicitně říkáme, že x_val a y_val jsou pole čísel (number[]).
        const x_val: number[] = [...aktualni_x, aktualni_x[0]!];
        const y_val: number[] = [...aktualni_y, aktualni_y[0]!];

        this.x_values_all.push(x_val);
        this.y_values_all.push(y_val);

        if (znamenko === "+") {
            this.x_values_kladne_all.push(x_val);
            this.y_values_kladne_all.push(y_val);
        }

        // --- VÝPOČET SMĚRNIC (a, b) ---
        const smernice_polygonu: Smernice[] = [];
        const eps = 1e-9;

        for (let i = 0; i < x_val.length - 1; i++) {
            // OPRAVA 2: Zde také přidáme vykřičník, abychom zaručili, že index v poli není undefined.
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
        this.a_values_all.push(smernice_polygonu);

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
            // OPRAVA 3: I zde použijeme vykřičníky pro iteraci
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
            // OPRAVA 4: Stejný princip pro finální počítání momentů
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
        const hmotnost_1bm = ro * plocha_abs * 1e-6;

        // --- ULOŽENÍ DO GLOBÁLNÍ PAMĚTI ---
        const nasobitel = znamenko === "-" ? -1 : 1;

        this.vsechny_plochy.push(plocha_abs * nasobitel);
        this.vsechny_momenty_setrvacnosti.push([vysledny_Ix * nasobitel, vysledny_Iy * nasobitel]);
        this.vsechny_dev_momenty.push(deviacni_moment * nasobitel);
        this.vsechny_hmotnosti.push(hmotnost_1bm * nasobitel);
        
        this.vsechny_teziste.push(teziste_vysledne);
        this.ro_all.push(ro);
        this.E_all.push(E);
    }
}






// doplnit prusečíky přímek

// do testů přidat daleko více polygonů, nějaký random tvary zkusit, pak napříč kvadrantama, a pak mě zajímá ten deviační moment po a proti směru hodinových ručiček