import type { IOperation } from "../IOperation";
import type { MaterialData } from "../../core/entities/material";
import type { Model } from "../../core/model";
import { recordChanged, type TransactionChanges } from "../changes";

export class UpdateMaterialOperation implements IOperation {
  #oldData?: MaterialData;
  #newData: MaterialData;
  public readonly id: string;

  constructor(newData: MaterialData) {
    this.id = newData.id;
    this.#newData = newData;
  }

  private applyData(
    model: Model,
    data: MaterialData,
    changes: TransactionChanges
  ): void | Error {
    const material = model.materials.get(this.id);
    if (!material) {
      return new Error(
        `UpdateMaterialOperation: Material "${this.id}" does not exist`
      );
    }

    material.E = data.E;
    material.G = data.G;
    material.alpha = data.alpha;
    material.density = data.density;

    recordChanged(changes, "material", this.id);
    for (const [elementId, element] of model.elements) {
      if (element.materialID === this.id) {
        recordChanged(changes, "element", elementId);
      }
    }
    return;
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    const oldData = model.materials.get(this.id)?.toData();
    if (!oldData) {
      return new Error(
        `UpdateMaterialOperation: Material "${this.id}" does not exist`
      );
    }
    this.#oldData = oldData;
    return this.applyData(model, this.#newData, changes);
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#oldData) {
      return new Error(
        `UpdateMaterialOperation: No record of material "${this.id}" to undo`
      );
    }
    return this.applyData(model, this.#oldData, changes);
  }
}
