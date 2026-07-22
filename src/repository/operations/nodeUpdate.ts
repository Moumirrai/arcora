import type { IOperation } from "../IOperation";
import type { NodeData } from "../../core/entities/node";
import type { Model } from "@arcora/core/model";
import type { TransactionChanges } from "../changes";

export class UpdateNodeOperation implements IOperation {
  #oldData?: NodeData;
  #newData: NodeData;
  public readonly id: string;

  constructor(newData: NodeData) {
    this.id = newData.id;
    this.#newData = newData;
  }

  private applyData(
    model: Model,
    data: NodeData,
    changes: TransactionChanges
  ): void | Error {
    const node = model.nodes.get(this.id);
    if (!node) {
      return new Error(`UpdateNodeOperation: Node "${this.id}" does not exist`);
    }

    node.pos = data.coords;
    node.prescribedDisplacement = data.prescribedDisplacement;
    node.name = data.name;

    changes.changed.set(this.id, { kind: "node", id: this.id });
    for (const elementId of node.connectedElementIDs) {
      changes.changed.set(elementId, { kind: "element", id: elementId });
    }
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    const oldData = model.nodes.get(this.id)?.toData();
    if (!oldData) {
      return new Error(`UpdateNodeOperation: Node "${this.id}" does not exist`);
    }
    this.#oldData = oldData;
    return this.applyData(model, this.#newData, changes);
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#oldData) {
      return new Error(
        `UpdateNodeOperation: No record of node "${this.id}" to undo`
      );
    }
    return this.applyData(model, this.#oldData, changes);
  }
}
