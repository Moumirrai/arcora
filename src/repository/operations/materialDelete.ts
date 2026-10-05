import type { IOperation } from "../IOperation";
import { Material, type MaterialData } from "../../core/entities/material";
import type { Model } from "../../core/model";
import {
  changeKey,
  recordAdded,
  recordRemoved,
  type TransactionChanges,
} from "../changes";

export class RemoveMaterialOperation implements IOperation {
  #materialData?: MaterialData;
  #skipped = false;

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#materialData) {
      model.materials.delete(this.id);
      recordRemoved(changes, "material", this.id);
      return;
    }

    const material = model.materials.get(this.id);
    if (!material) {
      if (changes.removed.has(changeKey("material", this.id))) {
        this.#skipped = true;
        return;
      }
      return new Error(
        `RemoveMaterialOperation: Material "${this.id}" does not exist`
      );
    }

    let owners = 0;

    for (const [_, element] of model.elements) {
      if (element.materialID === this.id) {
        owners++;
      }
    }

    if (owners > 0) {
      return new Error(
        `RemoveMaterialOperation: Material "${this.id}" is still in use by ${owners} element(s)`
      );
    }

    this.#materialData = material.toData();

    model.materials.delete(this.id);
    recordRemoved(changes, "material", this.id);
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#materialData) {
      if (this.#skipped) {
        return;
      }
      return new Error(
        `RemoveMaterialOperation: No record of material "${this.id}" to undo`
      );
    }

    model.materials.set(this.id, new Material(model, this.#materialData));
    recordAdded(changes, "material", this.id);

    return;
  }
}
