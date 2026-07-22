import type { IOperation } from "../IOperation";
import type { Model } from "@arcora/core/model";
import type { TransactionChanges } from "../changes";
import { Element, type ElementData } from "../../core/entities/element";

export class RemoveElementOperation implements IOperation {
  #elementData?: ElementData;
  #skipped = false;

  constructor(public readonly id: string) {}

  do(model: Model, changes: TransactionChanges): void | Error {
    if (this.#elementData) {
      model.elements.delete(this.id);
      changes.removed.set(this.id, {
        kind: "element",
        id: this.id,
      });
      return;
    }

    const element = model.elements.get(this.id);
    if (!element) {
      if (changes.removed.has(this.id)) {
        this.#skipped = true;
        return;
      }
      return new Error(
        `RemoveElementOperation: Element "${this.id}" does not exist`
      );
    }

    this.#elementData = element.toData();
    model.elements.delete(this.id);
    changes.removed.set(this.id, {
      kind: "element",
      id: this.id,
    });
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
    changes.added.set(this.id, {
      kind: "element",
      id: this.id,
    });
    return;
  }
}
