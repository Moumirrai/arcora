import type { IOperation } from "../IOperation";
import type { Model } from "@arcora/core/model";
import {
  changeKey,
  recordAdded,
  recordRemoved,
  type TransactionChanges,
} from "../changes";
import { Element, type ElementData } from "../../core/entities/element";
import { ElementLoad } from "../../core/entities/elementLoad";
import { RemoveLoadOperation } from "./loadDelete";

export class RemoveElementOperation implements IOperation {
  #elementData?: ElementData;
  #loadOps: RemoveLoadOperation[] = [];
  #skipped = false;

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#elementData) {
      for (const loadOp of this.#loadOps) {
        const err = loadOp.do(model, changes);
        if (err) return err;
      }
      model.elements.delete(this.id);
      recordRemoved(changes, "element", this.id);
      return;
    }

    const element = model.elements.get(this.id);
    if (!element) {
      if (changes.removed.has(changeKey("element", this.id))) {
        this.#skipped = true;
        return;
      }
      return new Error(
        `RemoveElementOperation: Element "${this.id}" does not exist`
      );
    }

    this.#elementData = element.toData();

    for (const [loadId, load] of model.loads) {
      if (load instanceof ElementLoad && load.elementID === this.id) {
        const loadOp = new RemoveLoadOperation(loadId);
        const err = loadOp.do(model, changes);
        if (err) return err;
        this.#loadOps.push(loadOp);
      }
    }

    model.elements.delete(this.id);
    recordRemoved(changes, "element", this.id);
    return;
  }

  undo(model: Model, changes: TransactionChanges): void | Error {
    if (!this.#elementData) {
      if (this.#skipped) {
        return;
      }
      return new Error(
        `RemoveElementOperation: No record of element "${this.id}" to undo`
      );
    }

    model.elements.set(this.id, new Element(model, this.#elementData));
    recordAdded(changes, "element", this.id);

    for (let i = this.#loadOps.length - 1; i >= 0; i--) {
      const err = this.#loadOps[i]!.undo(model, changes);
      if (err) return err;
    }
    return;
  }
}
