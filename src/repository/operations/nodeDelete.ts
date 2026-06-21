import type { IOperation } from "../IOperation";
import { Node, type NodeData } from "../../core/entities/node";
import type { Model } from "@arcora/core/model";
import type { TransactionChanges } from "../changes";
import { RemoveElementOperation } from "./elementDelete";

export class RemoveNodeOperation implements IOperation {
  #nodeData?: NodeData;
  #elementOps: RemoveElementOperation[] = [];

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#nodeData) {
      for (const elOp of this.#elementOps) {
        const err = elOp.do(model, changes);
        if (err) return err;
      }
      model.nodes.delete(this.id);
      changes.removed.set(this.id, { kind: "node", id: this.id });
      return;
    }

    const node = model.nodes.get(this.id);
    if (!node) {
      return new Error(`RemoveNodeOperation: Node "${this.id}" does not exist`);
    }

    this.#nodeData = node.toData();

    for (const [elId, element] of model.elements) {
      if (element.nodeIDs[0] === this.id || element.nodeIDs[1] === this.id) {
        const elOp = new RemoveElementOperation(elId);
        const err = elOp.do(model, changes);
        if (err) return err;
        this.#elementOps.push(elOp);
      }
    }

    model.nodes.delete(this.id);
    changes.removed.set(this.id, { kind: "node", id: this.id });
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#nodeData) {
      return new Error(
        `RemoveNodeOperation: No record of node "${this.id}" to undo`
      );
    }

    model.nodes.set(this.id, new Node(model, this.#nodeData));
    changes.added.set(this.id, { kind: "node", id: this.id });

    for (let i = this.#elementOps.length - 1; i >= 0; i--) {
      const err = this.#elementOps[i]!.undo(model, changes);
      if (err) return err;
    }
    return;
  }
}
