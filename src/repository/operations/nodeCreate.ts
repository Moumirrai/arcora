import type { IOperation } from "../IOperation";
import { Node } from "../../core/entities/node";
import type { Model } from "@arcora/core/model";
import type { TransactionChanges } from "../changes";

type AddNodeOptions = {
  x: number;
  z: number;
  name?: string;
};

export class AddNodeOperation implements IOperation {
  public readonly id: string;
  #createdNode?: Node;

  constructor(private opts: AddNodeOptions) {
    this.id = crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdNode) {
      model.nodes.set(this.id, this.#createdNode);
      changes.added.set(this.id, { kind: "node", id: this.id });
      return;
    }
    const assignedName =
      this.opts.name === undefined ? "TODO!!!" : this.opts.name;
    const newNode = new Node(model, {
      id: this.id,
      name: assignedName,
      coords: { x: this.opts.x, z: this.opts.z },
    });

    model.nodes.set(this.id, newNode);

    this.#createdNode = newNode;
    changes.added.set(this.id, { kind: "node", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdNode && model.nodes.has(this.id)) {
      model.nodes.delete(this.id);
      changes.removed.set(this.id, { kind: "node", id: this.id });
      return;
    }
    return new Error(
      `AddNodeOperation: No node was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
