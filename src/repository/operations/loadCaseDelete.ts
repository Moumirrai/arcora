import type { IOperation } from "../IOperation";
import { LoadCase, type LoadCaseData } from "../../core/entities/loadCase";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";
import { RemoveLoadOperation } from "./loadDelete";

export class RemoveLoadCaseOperation implements IOperation {
  #loadCaseData?: LoadCaseData;
  #loadOps: RemoveLoadOperation[] = [];
  #skipped = false;

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#loadCaseData) {
      for (const loadOp of this.#loadOps) {
        const err = loadOp.do(model, changes);
        if (err) return err;
      }
      model.loadCases.delete(this.id);
      changes.removed.set(this.id, { kind: "loadCase", id: this.id });
      return;
    }

    const loadCase = model.loadCases.get(this.id);
    if (!loadCase) {
      if (changes.removed.has(this.id)) {
        this.#skipped = true;
        return;
      }
      return new Error(
        `RemoveLoadCaseOperation: Load case "${this.id}" does not exist`
      );
    }

    this.#loadCaseData = loadCase.toData();

    for (const [loadId, load] of model.loads) {
      if (load.loadCaseID === this.id) {
        const loadOp = new RemoveLoadOperation(loadId);
        const err = loadOp.do(model, changes);
        if (err) return err;
        this.#loadOps.push(loadOp);
      }
    }

    model.loadCases.delete(this.id);
    changes.removed.set(this.id, { kind: "loadCase", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#loadCaseData) {
      if (this.#skipped) {
        return;
      }
      return new Error(
        `RemoveLoadCaseOperation: No record of load case "${this.id}" to undo`
      );
    }

    model.loadCases.set(this.id, new LoadCase(model, this.#loadCaseData));
    changes.added.set(this.id, { kind: "loadCase", id: this.id });

    for (let i = this.#loadOps.length - 1; i >= 0; i--) {
      const err = this.#loadOps[i]!.undo(model, changes);
      if (err) return err;
    }
    return;
  }
}
