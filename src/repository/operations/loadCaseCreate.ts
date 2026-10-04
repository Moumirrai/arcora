import type { IOperation } from "../IOperation";
import { LoadCase, LoadCaseType } from "../../core/entities/loadCase";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";

type AddLoadCaseOptions = {
  name: string;
  type: LoadCaseType;
  selfWeight: boolean;
  id?: string;
};

export class AddLoadCaseOperation implements IOperation {
  public readonly id: string;
  #createdLoadCase?: LoadCase;

  constructor(private opts: AddLoadCaseOptions) {
    this.id = opts.id ?? crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdLoadCase) {
      model.loadCases.set(this.id, this.#createdLoadCase);
      changes.added.set(this.id, { kind: "loadCase", id: this.id });
      return;
    }

    const newLoadCase = new LoadCase(model, {
      id: this.id,
      name: this.opts.name,
      type: this.opts.type,
      selfWeight: this.opts.selfWeight,
    });

    model.loadCases.set(this.id, newLoadCase);
    this.#createdLoadCase = newLoadCase;
    changes.added.set(this.id, { kind: "loadCase", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdLoadCase && model.loadCases.has(this.id)) {
      model.loadCases.delete(this.id);
      changes.removed.set(this.id, { kind: "loadCase", id: this.id });
      return;
    }
    return new Error(
      `AddLoadCaseOperation: No load case was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
