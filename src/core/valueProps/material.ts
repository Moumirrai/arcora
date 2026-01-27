import type { Model } from "../model";

export interface MaterialData {
    id: string;
    E: number; //Young's modulus
    G: number; //Shear modulus
    alpha: number; //Coefficient of thermal expansion
    density: number; //Density
}

export class Material {
    public readonly id: string;

    #E: number;
    #G: number;
    #alpha: number;
    #density: number;

    #model: Model;

    constructor(model: Model, data: MaterialData) {
        this.#model = model;
        this.id = data.id;
        this.#E = data.E;
        this.#G = data.G;
        this.#alpha = data.alpha;
        this.#density = data.density;
    }

    get E(): number {
        return this.#E;
    }

    set E(value: number) {
        this.#E = value;
        this.#model.dirty = true;
    }

    get G(): number {
        return this.#G;
    }

    set G(value: number) {
        this.#G = value;
        this.#model.dirty = true;
    }

    get alpha(): number {
        return this.#alpha;
    }

    set alpha(value: number) {
        this.#alpha = value;
        this.#model.dirty = true;
    }

    get density(): number {
        return this.#density;
    }

    set density(value: number) {
        this.#density = value;
        this.#model.dirty = true;
    }

    toData(): MaterialData {
        return {
            id: this.id,
            E: this.#E,
            G: this.#G,
            alpha: this.#alpha,
            density: this.#density,
        };
    }
}