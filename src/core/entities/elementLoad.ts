import type { Model } from "../model";
import type { Element } from "./element";
import type { Material } from "./material";
import type { Crossection } from "./crossection";
import type { WithOptional } from "../types";

export interface InternalForceContribution {
  N: number;
  V: number;
  M: number;
}

export interface ElementLoadData {
  id: string;
  elementID: string;
  loadCaseID: string;
}

export type ElementLoadDataPartial = WithOptional<ElementLoadData, "id">;

export abstract class ElementLoad {
  public readonly id: string;
  public readonly elementID: string;
  public readonly loadCaseID: string;

  #model: Model;
  #dirty = false;

  constructor(model: Model, data: ElementLoadDataPartial) {
    this.#model = model;
    this.id = data.id ?? crypto.randomUUID();
    this.elementID = data.elementID;
    this.loadCaseID = data.loadCaseID;
  }

  protected get element(): Element {
    const element = this.#model.elements.get(this.elementID);
    if (!element) throw new Error(`Element ${this.elementID} does not exist`);
    return element;
  }

  protected get material(): Material {
    const element = this.element;
    const material = this.#model.materials.get(element.materialID);
    if (!material)
      throw new Error(`Material ${element.materialID} does not exist`);
    return material;
  }

  protected get crossection(): Crossection {
    const element = this.element;
    const crossection = this.#model.crossections.get(element.crossectionID);
    if (!crossection)
      throw new Error(`Crossection ${element.crossectionID} does not exist`);
    return crossection;
  }

  // equivalent nodal forces in local coordinates, in DOF order
  abstract getEquivalentNodalForces(): Float64Array;

  // contribution of this load to the internal forces at distance `x` from node 1, in loacl coordinates
  abstract getInternalForceContribution(x: number): InternalForceContribution;

  get dirty(): boolean {
    return this.#dirty;
  }

  cleanDirty(): void {
    this.#dirty = false;
  }

  protected markDirty(): void {
    this.#dirty = true;
    this.#model.dirty = true;
  }

  toData(): ElementLoadData {
    return {
      id: this.id,
      elementID: this.elementID,
      loadCaseID: this.loadCaseID,
    };
  }
}
