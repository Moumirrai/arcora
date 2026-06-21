import type { IOperation } from "../IOperation";
import { Element } from "../../core/entities/element";
import type { Model } from "@arcora/core/model";
import type { TransactionChanges } from "../changes";

type AddElementOptions = {
  nodeIDs: [string, string];
};

export class AddElementOperation implements IOperation {
  public readonly id: string;
  #createdElement?: Element;

  constructor(private opts: AddElementOptions) {
    this.id = crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdElement) {
      model.elements.set(this.id, this.#createdElement);
      changes.added.set(this.id, {
        kind: "element",
        id: this.id,
      });
      return;
    }

    for (const nodeId of this.opts.nodeIDs) {
      if (!model.nodes.has(nodeId)) {
        return new Error(
          `AddElementOperation: Node "${nodeId}" does not exist`
        );
      }
    }

    const newElement = new Element(model, {
      id: this.id,
      nodeIDs: this.opts.nodeIDs,
    });
    model.elements.set(this.id, newElement);
    this.#createdElement = newElement;
    changes.added.set(this.id, {
      kind: "element",
      id: this.id,
    });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdElement && model.elements.has(this.id)) {
      model.elements.delete(this.id);
      changes.removed.set(this.id, {
        kind: "element",
        id: this.id,
      });
      return;
    }
    return new Error(
      `AddElementOperation: No element was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
