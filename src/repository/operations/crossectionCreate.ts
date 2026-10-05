import type { IOperation } from "../IOperation";
import { Crossection } from "../../core/entities/crossection";
import type { Model } from "../../core/model";
import {
  recordAdded,
  recordRemoved,
  type TransactionChanges,
} from "../changes";

type AddCrossectionOptions = {
  area: number;
  Iy: number;
  Iz: number;
  id?: string;
};

export class AddCrossectionOperation implements IOperation {
  public readonly id: string;
  #createdCrossection?: Crossection;

  constructor(private opts: AddCrossectionOptions) {
    this.id = opts.id ?? crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdCrossection) {
      model.crossections.set(this.id, this.#createdCrossection);
      recordAdded(changes, "crossSection", this.id);
      return;
    }

    const newCrossection = new Crossection(model, {
      id: this.id,
      area: this.opts.area,
      Iy: this.opts.Iy,
      Iz: this.opts.Iz,
    });

    model.crossections.set(this.id, newCrossection);
    this.#createdCrossection = newCrossection;
    recordAdded(changes, "crossSection", this.id);
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdCrossection && model.crossections.has(this.id)) {
      model.crossections.delete(this.id);
      recordRemoved(changes, "crossSection", this.id);
      return;
    }
    return new Error(
      `AddCrossectionOperation: No crossection was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
