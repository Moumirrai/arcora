import type { Model } from "../core/model";
import type { Transaction } from "./Transaction";

export class ModelRepository {
  private _undoStack: Transaction[] = [];
  private _redoStack: Transaction[] = [];

  constructor(
    private model: Model,
    private undoHistory: number = 50
  ) {}

  public commit(transaction: Transaction): void {
    const success = transaction.do(this.model);

    if (!success) {
      console.error("transaction do failed");
      return;
    }

    this._undoStack.push(transaction); //add transaction to end of undo stack
    if (this._undoStack.length > this.undoHistory) this._undoStack.shift(); //if max history exceeded, remove first element
    this._redoStack = []; //clear redo stack
  }

  public undo(count: number = 1): void {
    if (count <= 0) {
      console.error("Invalid undo count");
      return;
    }

    if (this._undoStack.length < count) {
      console.error("Undo stack out of bounds");
      return;
    }

    for (let i = 0; i < count; i++) {
      const transaction = this._undoStack.pop()!;
      const success = transaction.undo(this.model);

      if (!success) {
        console.error("transaction undo failed");
        return;
      }

      this._redoStack.push(transaction);
    }
  }

  public redo(count: number = 1): void {
    if (count <= 0) {
      console.error("Invalid redo count");
      return;
    }

    if (this._redoStack.length < count) {
      console.error("Redo stack out of bounds");
      return;
    }

    for (let i = 0; i < count; i++) {
      const transaction = this._redoStack.pop()!;
      const success = transaction.do(this.model);

      if (!success) {
        console.error("transaction redo (do) failed");
        return;
      }

      // push the redone transaction back onto the undo stack
      this._undoStack.push(transaction);
      // ensure undo history limit
      if (this._undoStack.length > this.undoHistory) this._undoStack.shift();
    }
  }
}
