import type { Model } from "../model";
import type { WithOptional } from "../types";

export enum LoadCaseType {
  Dead = "Dead",
  Live = "Live",
  Wind = "Wind",
  Snow = "Snow",
}

export interface LoadCaseData {
  id: string;
  name: string;
  type: LoadCaseType;
  selfWeight: boolean;
}

export type LoadCaseDataPartial = WithOptional<LoadCaseData, "id">;

export class LoadCase {
  public readonly id: string;
  public name: string;

  #type: LoadCaseType;
  #selfWeight: boolean;

  #model: Model;
  #dirty = false;

  constructor(model: Model, data: LoadCaseDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
    this.name = data.name;
    this.#type = data.type;
    this.#selfWeight = data.selfWeight;
  }

  get type(): LoadCaseType {
    return this.#type;
  }

  set type(value: LoadCaseType) {
    this.#type = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get selfWeight(): boolean {
    return this.#selfWeight;
  }

  set selfWeight(value: boolean) {
    this.#selfWeight = value;
    this.#dirty = true;
    this.#model.dirty = true;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
  }

  toData(): LoadCaseData {
    return {
      id: this.id,
      name: this.name,
      type: this.#type,
      selfWeight: this.#selfWeight,
    };
  }
}
