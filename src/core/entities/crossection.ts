import type { Model } from "../model";
import type { WithOptional } from "../types";

export interface CrossectionData {
  id: string;
  area: number; //Cross-sectional area
  Iy: number; //Moment of inertia about local y-axis
  Iz: number; //Moment of inertia about local z-axis
}

type CrossectionDataPartial = WithOptional<CrossectionData, "id">;

export class Crossection {
  public readonly id: string;

  #area: number;
  #Iy: number;
  #Iz: number;

  #model: Model;
  #dirty = false;

  constructor(model: Model, data: CrossectionDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
    this.#area = data.area;
    this.#Iy = data.Iy;
    this.#Iz = data.Iz;
  }

  get area(): number {
    return this.#area;
  }

  set area(value: number) {
    this.#area = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get Iy(): number {
    return this.#Iy;
  }

  set Iy(value: number) {
    this.#Iy = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get Iz(): number {
    return this.#Iz;
  }

  set Iz(value: number) {
    this.#Iz = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
  }

  toData(): CrossectionData {
    return {
      id: this.id,
      area: this.#area,
      Iy: this.#Iy,
      Iz: this.#Iz,
    };
  }
}
