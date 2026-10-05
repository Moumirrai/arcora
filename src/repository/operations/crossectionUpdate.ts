import type { IOperation } from "../IOperation";
import type { CrossectionData } from "../../core/entities/crossection";
import type { Model } from "../../core/model";
import { recordChanged, type TransactionChanges } from "../changes";

export class UpdateCrossectionOperation implements IOperation {
  #oldData?: CrossectionData;
  #newData: CrossectionData;
  public readonly id: string;

  constructor(newData: CrossectionData) {
    this.id = newData.id;
    this.#newData = newData;
  }

  private applyData(
    model: Model,
    data: CrossectionData,
    changes: TransactionChanges
  ): void | Error {
    const crossection = model.crossections.get(this.id);
    if (!crossection) {
      return new Error(
        `UpdateCrossectionOperation: Crossection "${this.id}" does not exist`
      );
    }

    crossection.area = data.area;
    crossection.Iy = data.Iy;
    crossection.Iz = data.Iz;

    recordChanged(changes, "crossSection", this.id);
    for (const [elementId, element] of model.elements) {
      if (element.crossectionID === this.id) {
        recordChanged(changes, "element", elementId);
      }
    }
    return;
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    const oldData = model.crossections.get(this.id)?.toData();
    if (!oldData) {
      return new Error(
        `UpdateCrossectionOperation: Crossection "${this.id}" does not exist`
      );
    }
    this.#oldData = oldData;
    return this.applyData(model, this.#newData, changes);
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#oldData) {
      return new Error(
        `UpdateCrossectionOperation: No record of crossection "${this.id}" to undo`
      );
    }
    return this.applyData(model, this.#oldData, changes);
  }
}
