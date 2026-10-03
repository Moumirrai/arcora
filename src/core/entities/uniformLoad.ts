import type { Model } from "../model";
import type { WithOptional } from "../types";
import {
  ElementLoad,
  type ElementLoadData,
  type InternalForceContribution,
} from "./elementLoad";

export interface UniformLoadData extends ElementLoadData {
  qx: number; //distributed axial load in local x (force / length)
  qy: number; //distributed transverse load in local y (force / length)
}

export type UniformLoadDataPartial = WithOptional<UniformLoadData, "id">;

export class UniformLoad extends ElementLoad {
  #qx: number;
  #qy: number;

  constructor(model: Model, data: UniformLoadDataPartial) {
    super(model, data);
    this.#qx = data.qx;
    this.#qy = data.qy;
  }

  get qx(): number {
    return this.#qx;
  }

  set qx(value: number) {
    this.#qx = value;
    this.markDirty();
  }

  get qy(): number {
    return this.#qy;
  }

  set qy(value: number) {
    this.#qy = value;
    this.markDirty();
  }

  getEquivalentNodalForces(): Float64Array {
    const L = this.element.length;
    const f = new Float64Array([
      (this.#qx * L) / 2,
      (this.#qy * L) / 2,
      (this.#qy * L * L) / 12,
      (this.#qx * L) / 2,
      (this.#qy * L) / 2,
      (-this.#qy * L * L) / 12,
    ]);
    return this.element.condenseLocalForces(f);
  }

  getInternalForceContribution(x: number): InternalForceContribution {
    const L = this.element.length;
    const f = this.element.condenseLocalForces(
      new Float64Array([
        (this.#qx * L) / 2,
        (this.#qy * L) / 2,
        (this.#qy * L * L) / 12,
        (this.#qx * L) / 2,
        (this.#qy * L) / 2,
        (-this.#qy * L * L) / 12,
      ])
    );
    const N1e = f[0]!;
    const V1e = f[1]!;
    const M1e = f[2]!;
    return {
      N: N1e - this.#qx * x,
      V: V1e - this.#qy * x,
      M: M1e + V1e * x - (this.#qy * x * x) / 2,
    };
  }

  override toData(): UniformLoadData {
    return { ...super.toData(), qx: this.#qx, qy: this.#qy };
  }
}
