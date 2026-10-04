import type { IOperation } from "../IOperation";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";
import { createLoad, loadToData, type LoadData } from "./loadData";

export class RemoveLoadOperation implements IOperation {
  #loadData?: LoadData;
  #skipped = false;

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#loadData) {
      model.loads.delete(this.id);
      changes.removed.set(this.id, { kind: "load", id: this.id });
      return;
    }

    const load = model.loads.get(this.id);
    if (!load) {
      if (changes.removed.has(this.id)) {
        this.#skipped = true;
        return;
      }
      return new Error(`RemoveLoadOperation: Load "${this.id}" does not exist`);
    }

    this.#loadData = loadToData(load);
    model.loads.delete(this.id);
    changes.removed.set(this.id, { kind: "load", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#loadData) {
      if (this.#skipped) {
        return;
      }
      return new Error(
        `RemoveLoadOperation: No record of load "${this.id}" to undo`
      );
    }

    model.loads.set(this.id, createLoad(model, this.#loadData));
    changes.added.set(this.id, { kind: "load", id: this.id });
    return;
  }
}
