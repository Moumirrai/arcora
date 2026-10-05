import type { IOperation } from "../IOperation";
import type { Model } from "../../core/model";
import { recordChanged, type TransactionChanges } from "../changes";
import { loadToData, loadTypeOf, type LoadData } from "./loadData";
import type { NodalLoad } from "../../core/entities/nodalLoad";
import type { UniformLoad } from "../../core/entities/uniformLoad";
import type { TrapezoidalLoad } from "../../core/entities/trapezoidalLoad";
import type { PointLoadOnSpan } from "../../core/entities/pointLoadOnSpan";
import type { ThermalLoad } from "../../core/entities/thermalLoad";

export class UpdateLoadOperation implements IOperation {
  #oldData?: LoadData;
  #newData: LoadData;
  public readonly id: string;

  constructor(newData: LoadData) {
    this.id = newData.id;
    this.#newData = newData;
  }

  private applyData(
    model: Model,
    data: LoadData,
    changes: TransactionChanges
  ): void | Error {
    const load = model.loads.get(this.id);
    if (!load) {
      return new Error(`UpdateLoadOperation: Load "${this.id}" does not exist`);
    }
    if (loadTypeOf(load) !== data.type) {
      return new Error(
        `UpdateLoadOperation: Load "${this.id}" is not of type "${data.type}"`
      );
    }

    switch (data.type) {
      case "nodal": {
        const nodal = load as NodalLoad;
        nodal.Fx = data.Fx;
        nodal.Fy = data.Fy;
        nodal.Mz = data.Mz;
        break;
      }
      case "uniform": {
        const uniform = load as UniformLoad;
        uniform.qx = data.qx;
        uniform.qy = data.qy;
        break;
      }
      case "trapezoidal": {
        const trapezoidal = load as TrapezoidalLoad;
        trapezoidal.q1x = data.q1x;
        trapezoidal.q1y = data.q1y;
        trapezoidal.q2x = data.q2x;
        trapezoidal.q2y = data.q2y;
        break;
      }
      case "pointOnSpan": {
        const point = load as PointLoadOnSpan;
        point.position = data.position;
        point.Fx = data.Fx;
        point.Fy = data.Fy;
        point.Mz = data.Mz;
        break;
      }
      case "thermal": {
        const thermal = load as ThermalLoad;
        thermal.deltaT = data.deltaT;
        thermal.deltaTGradient = data.deltaTGradient;
        break;
      }
    }

    recordChanged(changes, "load", this.id);
    return;
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    const oldData = model.loads.get(this.id);
    if (!oldData) {
      return new Error(`UpdateLoadOperation: Load "${this.id}" does not exist`);
    }
    this.#oldData = loadToData(oldData);
    return this.applyData(model, this.#newData, changes);
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#oldData) {
      return new Error(
        `UpdateLoadOperation: No record of load "${this.id}" to undo`
      );
    }
    return this.applyData(model, this.#oldData, changes);
  }
}
