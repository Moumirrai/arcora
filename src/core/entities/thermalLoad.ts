import type { Model } from "../model";
import type { WithOptional } from "../types";
import {
  ElementLoad,
  type ElementLoadData,
  type InternalForceContribution,
} from "./elementLoad";

export interface ThermalLoadData extends ElementLoadData {
  deltaT: number; //uniform temperature change (expansion if > 0)
  deltaTGradient: number; //temperature gradient across section depth
}

export type ThermalLoadDataPartial = WithOptional<ThermalLoadData, "id">;

export class ThermalLoad extends ElementLoad {
  #deltaT: number;
  #deltaTGradient: number;

  constructor(model: Model, data: ThermalLoadDataPartial) {
    super(model, data);
    this.#deltaT = data.deltaT;
    this.#deltaTGradient = data.deltaTGradient;
  }

  get deltaT(): number {
    return this.#deltaT;
  }

  set deltaT(value: number) {
    this.#deltaT = value;
    this.markDirty();
  }

  get deltaTGradient(): number {
    return this.#deltaTGradient;
  }

  set deltaTGradient(value: number) {
    this.#deltaTGradient = value;
    this.markDirty();
  }

  getEquivalentNodalForces(): Float64Array {
    const E = this.material.E;
    const alpha = this.material.alpha;
    const A = this.crossection.area;
    const Iy = this.crossection.Iy;

    const fAxial = E * A * alpha * this.#deltaT;
    const fMoment = E * Iy * alpha * this.#deltaTGradient;

    const f = new Float64Array([-fAxial, 0, -fMoment, fAxial, 0, fMoment]);
    return this.element.condenseLocalForces(f);
  }

  getInternalForceContribution(x: number): InternalForceContribution {
    const E = this.material.E;
    const alpha = this.material.alpha;
    const A = this.crossection.area;
    const Iy = this.crossection.Iy;

    const fAxial = E * A * alpha * this.#deltaT;
    const fMoment = E * Iy * alpha * this.#deltaTGradient;

    const f = this.element.condenseLocalForces(
      new Float64Array([-fAxial, 0, -fMoment, fAxial, 0, fMoment])
    );
    return {
      N: f[0]!,
      V: f[1]!,
      M: f[2]! + f[1]! * x,
    };
  }

  override toData(): ThermalLoadData {
    return {
      ...super.toData(),
      deltaT: this.#deltaT,
      deltaTGradient: this.#deltaTGradient,
    };
  }
}
