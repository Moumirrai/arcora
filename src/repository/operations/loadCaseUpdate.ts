import type { IOperation } from "../IOperation";
import type { LoadCaseData } from "../../core/entities/loadCase";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";

export class UpdateLoadCaseOperation implements IOperation {
  #oldData?: LoadCaseData;
  #newData: LoadCaseData;
  public readonly id: string;

  constructor(newData: LoadCaseData) {
    this.id = newData.id;
    this.#newData = newData;
  }

  private applyData(
    model: Model,
    data: LoadCaseData,
    changes: TransactionChanges
  ): void | Error {
    const loadCase = model.loadCases.get(this.id);
    if (!loadCase) {
      return new Error(
        `UpdateLoadCaseOperation: Load case "${this.id}" does not exist`
      );
    }

    loadCase.name = data.name;
    loadCase.type = data.type;
    loadCase.selfWeight = data.selfWeight;

    changes.changed.set(this.id, { kind: "loadCase", id: this.id });
    for (const [loadId, load] of model.loads) {
      if (load.loadCaseID === this.id) {
        changes.changed.set(loadId, { kind: "load", id: loadId });
      }
    }
    return;
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    const oldData = model.loadCases.get(this.id)?.toData();
    if (!oldData) {
      return new Error(
        `UpdateLoadCaseOperation: Load case "${this.id}" does not exist`
      );
    }
    this.#oldData = oldData;
    return this.applyData(model, this.#newData, changes);
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#oldData) {
      return new Error(
        `UpdateLoadCaseOperation: No record of load case "${this.id}" to undo`
      );
    }
    return this.applyData(model, this.#oldData, changes);
  }
}
