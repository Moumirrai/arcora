import type { IOperation } from "../IOperation";
import type { Load } from "../../core/entities/load";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";
import { createLoad, type LoadDataPartial } from "./loadData";

export class AddLoadOperation implements IOperation {
  public readonly id: string;
  #createdLoad?: Load;

  constructor(private opts: LoadDataPartial) {
    this.id = opts.id ?? crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdLoad) {
      model.loads.set(this.id, this.#createdLoad);
      changes.added.set(this.id, { kind: "load", id: this.id });
      return;
    }

    const opts = this.opts;
    if (opts.type === "nodal") {
      if (!model.nodes.has(opts.nodeID)) {
        return new Error(
          `AddLoadOperation: Node "${opts.nodeID}" does not exist`
        );
      }
    } else if (!model.elements.has(opts.elementID)) {
      return new Error(
        `AddLoadOperation: Element "${opts.elementID}" does not exist`
      );
    }

    if (!model.loadCases.has(opts.loadCaseID)) {
      return new Error(
        `AddLoadOperation: Load case "${opts.loadCaseID}" does not exist`
      );
    }

    const newLoad = createLoad(model, { ...opts, id: this.id });
    model.loads.set(this.id, newLoad);
    this.#createdLoad = newLoad;
    changes.added.set(this.id, { kind: "load", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdLoad && model.loads.has(this.id)) {
      model.loads.delete(this.id);
      changes.removed.set(this.id, { kind: "load", id: this.id });
      return;
    }
    return new Error(
      `AddLoadOperation: No load was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
