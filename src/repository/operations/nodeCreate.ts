import type { IOperation } from "../IOperation";
import { Node } from "../../core/entities/node";
import { v4 as uuidv4 } from "uuid";
import type { Model } from "@arcora/core/model";

type AddNodeOptions = {
  x: number;
  z: number;
  name?: string;
};

export class AddNodeOperation implements IOperation {
  private id: string;
  private createdNode?: Node;

  constructor(private opts: AddNodeOptions) {
    this.id = uuidv4();
  }

  do(model: Model): boolean {
    if (this.createdNode) {
      model.nodes.set(this.id, this.createdNode);
      return true;
    }
    const assignedName =
      this.opts.name === undefined ? "TODO!!!" : this.opts.name;
    const newNode = new Node(model, {
      id: this.id,
      name: assignedName,
      coords: { x: this.opts.x, z: this.opts.z },
    });

    model.nodes.set(this.id, newNode);

    this.createdNode = newNode;
    return true;
  }

  undo(model: Model): boolean {
    if (this.createdNode && model.nodes.has(this.id)) {
      model.nodes.delete(this.id);
      return true;
    } else {
      console.warn(
        `AddNodeOperation: No node was created previously for ID "${this.id}". Nothing to undo.`
      );
      return false;
    }
  }
}
