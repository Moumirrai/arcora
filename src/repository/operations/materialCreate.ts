import type { IOperation } from "../IOperation";
import { Material } from "../../core/entities/material";
import type { Model } from "../../core/model";
import {
  recordAdded,
  recordRemoved,
  type TransactionChanges,
} from "../changes";

type AddMaterialOptions = {
  E: number;
  G: number;
  alpha: number;
  density: number;
  id?: string;
};

export class AddMaterialOperation implements IOperation {
  public readonly id: string;
  #createdMaterial?: Material;

  constructor(private opts: AddMaterialOptions) {
    this.id = opts.id ?? crypto.randomUUID();
  }

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdMaterial) {
      model.materials.set(this.id, this.#createdMaterial);
      recordAdded(changes, "material", this.id);
      return;
    }

    const newMaterial = new Material(model, {
      id: this.id,
      E: this.opts.E,
      G: this.opts.G,
      alpha: this.opts.alpha,
      density: this.opts.density,
    });

    model.materials.set(this.id, newMaterial);
    this.#createdMaterial = newMaterial;
    recordAdded(changes, "material", this.id);
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (this.#createdMaterial && model.materials.has(this.id)) {
      model.materials.delete(this.id);
      recordRemoved(changes, "material", this.id);
      return;
    }
    return new Error(
      `AddMaterialOperation: No material was created previously for ID "${this.id}". Nothing to undo.`
    );
  }
}
