import type { Model } from "../model";
import type { WithOptional } from "../types";

enum LoadCaseType {
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

  get selfWeight(): boolean {
    return this.#selfWeight;
  }

  set type(value: LoadCaseType) {
    this.#type = value;
    this.#model.dirty = true;
  }

  set selfWeight(value: boolean) {
    this.#selfWeight = value;
    this.#model.dirty = true;
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
