import type { Model } from "../model";
import type { WithOptional } from "../types";

export interface MaterialData {
  id: string;
  E: number; //Young's modulus
  G: number; //Shear modulus
  alpha: number; //Coefficient of thermal expansion
  density: number; //Density
}

export type MaterialDataPartial = WithOptional<MaterialData, "id">;

export class Material {
  public readonly id: string;

  #E: number;
  #G: number;
  #alpha: number;
  #density: number;

  #model: Model;
  #dirty = false;

  constructor(model: Model, data: MaterialDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
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
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get G(): number {
    return this.#G;
  }

  set G(value: number) {
    this.#G = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get alpha(): number {
    return this.#alpha;
  }

  set alpha(value: number) {
    this.#alpha = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get density(): number {
    return this.#density;
  }

  set density(value: number) {
    this.#density = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
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
