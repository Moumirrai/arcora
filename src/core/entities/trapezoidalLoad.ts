import type { Model } from "../model";
import type { WithOptional } from "../types";
import {
  ElementLoad,
  type ElementLoadData,
  type InternalForceContribution,
} from "./elementLoad";

export interface TrapezoidalLoadData extends ElementLoadData {
  q1x: number; //axial load at node 1
  q1y: number; //transverse load at node 1
  q2x: number; //axial load at node 2
  q2y: number; //transverse load at node 2
}

export type TrapezoidalLoadDataPartial = WithOptional<
  TrapezoidalLoadData,
  "id"
>;

export class TrapezoidalLoad extends ElementLoad {
  #q1x: number;
  #q1y: number;
  #q2x: number;
  #q2y: number;

  constructor(model: Model, data: TrapezoidalLoadDataPartial) {
    super(model, data);
    this.#q1x = data.q1x;
    this.#q1y = data.q1y;
    this.#q2x = data.q2x;
    this.#q2y = data.q2y;
  }

  get q1x(): number {
    return this.#q1x;
  }

  set q1x(value: number) {
    this.#q1x = value;
    this.markDirty();
  }

  get q1y(): number {
    return this.#q1y;
  }

  set q1y(value: number) {
    this.#q1y = value;
    this.markDirty();
  }

  get q2x(): number {
    return this.#q2x;
  }

  set q2x(value: number) {
    this.#q2x = value;
    this.markDirty();
  }

  get q2y(): number {
    return this.#q2y;
  }

  set q2y(value: number) {
    this.#q2y = value;
    this.markDirty();
  }

  getEquivalentNodalForces(): Float64Array {
    const L = this.element.length;
    const dqx = this.#q2x - this.#q1x;
    const dqy = this.#q2y - this.#q1y;
    const f = new Float64Array([
      (this.#q1x * L) / 2 + (dqx * L) / 6,
      (this.#q1y * L) / 2 + (dqy * L * 3) / 20,
      (this.#q1y * L * L) / 12 + (dqy * L * L) / 30,
      (this.#q1x * L) / 2 + (dqx * L) / 3,
      (this.#q1y * L) / 2 + (dqy * L * 7) / 20,
      -((this.#q1y * L * L) / 12 + (dqy * L * L) / 20),
    ]);
    return this.element.condenseLocalForces(f);
  }

  getInternalForceContribution(x: number): InternalForceContribution {
    const L = this.element.length;
    const dqx = this.#q2x - this.#q1x;
    const dqy = this.#q2y - this.#q1y;

    const f = this.element.condenseLocalForces(
      new Float64Array([
        (this.#q1x * L) / 2 + (dqx * L) / 6,
        (this.#q1y * L) / 2 + (dqy * L * 3) / 20,
        (this.#q1y * L * L) / 12 + (dqy * L * L) / 30,
        (this.#q1x * L) / 2 + (dqx * L) / 3,
        (this.#q1y * L) / 2 + (dqy * L * 7) / 20,
        -((this.#q1y * L * L) / 12 + (dqy * L * L) / 20),
      ])
    );
    const N1e = f[0]!;
    const V1e = f[1]!;
    const M1e = f[2]!;

    const axialInt = this.#q1x * x + (dqx * x * x) / (2 * L);
    const shearInt = this.#q1y * x + (dqy * x * x) / (2 * L);
    const momentInt = (this.#q1y * x * x) / 2 + (dqy * x * x * x) / (6 * L);

    return {
      N: N1e - axialInt,
      V: V1e - shearInt,
      M: M1e + V1e * x - momentInt,
    };
  }

  override toData(): TrapezoidalLoadData {
    return {
      ...super.toData(),
      q1x: this.#q1x,
      q1y: this.#q1y,
      q2x: this.#q2x,
      q2y: this.#q2y,
    };
  }
}
