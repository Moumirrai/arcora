import type { Model } from "../model";
import type { WithOptional } from "../types";
import {
  ElementLoad,
  type ElementLoadData,
  type InternalForceContribution,
} from "./elementLoad";

export interface PointLoadOnSpanData extends ElementLoadData {
  position: number; //normalized position along element (0..1), 0 = node 1
  Fx: number; //force in local x (axial)
  Fy: number; //force in local y (transverse)
  Mz: number; //concentrated couple about local z
}

export type PointLoadOnSpanDataPartial = WithOptional<
  PointLoadOnSpanData,
  "id"
>;

export class PointLoadOnSpan extends ElementLoad {
  #position: number;
  #Fx: number;
  #Fy: number;
  #Mz: number;

  constructor(model: Model, data: PointLoadOnSpanDataPartial) {
    super(model, data);
    this.#position = data.position;
    this.#Fx = data.Fx;
    this.#Fy = data.Fy;
    this.#Mz = data.Mz;
  }

  get position(): number {
    return this.#position;
  }

  set position(value: number) {
    this.#position = value;
    this.markDirty();
  }

  get Fx(): number {
    return this.#Fx;
  }

  set Fx(value: number) {
    this.#Fx = value;
    this.markDirty();
  }

  get Fy(): number {
    return this.#Fy;
  }

  set Fy(value: number) {
    this.#Fy = value;
    this.markDirty();
  }

  get Mz(): number {
    return this.#Mz;
  }

  set Mz(value: number) {
    this.#Mz = value;
    this.markDirty();
  }

  private getLocalEquivalentNodalForces(): Float64Array {
    const L = this.element.length;
    const a = this.#position * L;
    const r = this.#position;
    const f = new Float64Array(6);

    f[0] = this.#Fx * (1 - r);
    f[3] = this.#Fx * r;

    const b = L - a;
    f[1] = (this.#Fy * b * b * (L + 2 * a)) / L ** 3;
    f[4] = (this.#Fy * a * a * (3 * L - 2 * a)) / L ** 3;
    f[2] = (this.#Fy * a * b * b) / L ** 2;
    f[5] = (-this.#Fy * a * a * b) / L ** 2;

    f[1] += (this.#Mz * (-6 * a * b)) / L ** 3;
    f[2] += this.#Mz * (1 - 4 * r + 3 * r ** 2);
    f[4] += (this.#Mz * (6 * a * b)) / L ** 3;
    f[5] += this.#Mz * (-2 * r + 3 * r ** 2);

    return f;
  }

  getEquivalentNodalForces(): Float64Array {
    const f = this.getLocalEquivalentNodalForces();
    return this.element.condenseLocalForces(f);
  }

  getInternalForceContribution(x: number): InternalForceContribution {
    const L = this.element.length;
    const a = this.#position * L;
    const atOrPast = x >= a ? 1 : 0;

    const f = this.element.condenseLocalForces(
      this.getLocalEquivalentNodalForces()
    );
    const N1e = f[0]!;
    const V1e = f[1]!;
    const M1e = f[2]!;

    return {
      N: N1e - this.#Fx * atOrPast,
      V: V1e - this.#Fy * atOrPast,
      M: M1e + V1e * x - this.#Fy * (x - a) * atOrPast - this.#Mz * atOrPast,
    };
  }

  override toData(): PointLoadOnSpanData {
    return {
      ...super.toData(),
      position: this.#position,
      Fx: this.#Fx,
      Fy: this.#Fy,
      Mz: this.#Mz,
    };
  }
}
