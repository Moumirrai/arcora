import type { IOperation } from "../IOperation";
import { Element } from "../../core/entities/element";
import type { Model } from "../../core/model";
import type { TransactionChanges } from "../changes";

type AddElementOptions = {
  nodeIDs: readonly [string, string];
  id?: string;
};

export class AddElementOperation implements IOperation {
  readonly id: string;
  private createdElement?: Element;

  constructor(private opts: AddElementOptions) {
    this.id = opts.id ?? crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.createdElement) {
      model.elements.set(this.id, this.createdElement);
      changes.added.set(this.id, { kind: "element", id: this.id });
      return;
    }

    if (!model.nodes.has(this.opts.nodeIDs[0])) {
      return new Error(
        `AddElementOperation: Node "${this.opts.nodeIDs[0]}" does not exist`
      );
    }
    if (!model.nodes.has(this.opts.nodeIDs[1])) {
      return new Error(
        `AddElementOperation: Node "${this.opts.nodeIDs[1]}" does not exist`
      );
    }

    const newElement = new Element(model, {
      id: this.id,
      nodeIDs: this.opts.nodeIDs,
    });
    model.elements.set(this.id, newElement);
    this.createdElement = newElement;
    changes.added.set(this.id, { kind: "element", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.createdElement && model.elements.has(this.id)) {
      model.elements.delete(this.id);
      changes.removed.set(this.id, { kind: "element", id: this.id });
      return;
    }
    return new Error(
      `AddElementOperation: No element was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
