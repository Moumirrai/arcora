import type { IOperation } from "../IOperation";
import {
  Crossection,
  type CrossectionData,
} from "../../core/entities/crossection";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";

export class RemoveCrossectionOperation implements IOperation {
  #crossectionData?: CrossectionData;
  #skipped = false;

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#crossectionData) {
      model.crossections.delete(this.id);
      changes.removed.set(this.id, { kind: "crossSection", id: this.id });
      return;
    }

    const crossection = model.crossections.get(this.id);
    if (!crossection) {
      if (changes.removed.has(this.id)) {
        this.#skipped = true;
        return;
      }
      return new Error(
        `RemoveCrossectionOperation: Crossection "${this.id}" does not exist`
      );
    }

    let owners = 0;

    for (const [_, element] of model.elements) {
      if (element.crossectionID === this.id) {
        owners++;
      }
    }

    if (owners > 0) {
      return new Error(
        `RemoveCrossectionOperation: Crossection "${this.id}" is still in use by ${owners} element(s)`
      );
    }

    this.#crossectionData = crossection.toData();

    model.crossections.delete(this.id);
    changes.removed.set(this.id, { kind: "crossSection", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#crossectionData) {
      if (this.#skipped) {
        return;
      }
      return new Error(
        `RemoveCrossectionOperation: No record of crossection "${this.id}" to undo`
      );
    }

    model.crossections.set(
      this.id,
      new Crossection(model, this.#crossectionData)
    );
    changes.added.set(this.id, { kind: "crossSection", id: this.id });

    return;
  }
}
