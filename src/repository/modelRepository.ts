import type { Model } from "../core/model";
import type { Transaction } from "./Transaction";
import { createTransactionChanges, type TransactionChanges } from "./changes";

export type TransactionChangeListener = (changes: TransactionChanges) => void;

export class ModelRepository {
  #undoStack: Transaction[] = [];
  #redoStack: Transaction[] = [];
  #listeners: Set<TransactionChangeListener> = new Set();
  #model: Model;
  #maxUndoHistory: number = 100;

  constructor(model: Model, undoHistory?: number) {
    this.#model = model;
    this.#maxUndoHistory = undoHistory ?? 100;
  }

  public onChange(listener: TransactionChangeListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  get undoStack(): Transaction[] {
    return [...this.#undoStack];
  }

  get redoStack(): Transaction[] {
    return [...this.#redoStack];
  }

  private emitChange(changes: TransactionChanges): void {
    for (const listener of this.#listeners) {
      listener(changes);
    }
  }

  public apply(transaction: Transaction): void {
    const changes = createTransactionChanges();
    const success = transaction.do(this.#model, changes);

    // TODO: propagate error to caller instead of silently logging
    if (!success) {
      console.error("transaction apply failed");
      return;
    }

    this.emitChange(changes);
  }

  public commit(transaction: Transaction): void {
    const changes = createTransactionChanges();
    const success = transaction.do(this.#model, changes);

    if (!success) {
      console.error("transaction do failed");
      return;
    }

    this.#undoStack.push(transaction);
    if (this.#undoStack.length > this.#maxUndoHistory) this.#undoStack.shift();
    this.#redoStack = [];

    this.emitChange(changes);
  }

  public undo(count: number = 1): void {
    if (count <= 0) {
      console.error("Invalid undo count");
      return;
    }

    if (this.#undoStack.length < count) {
      console.error("Undo stack out of bounds");
      return;
    }

    for (let i = 0; i < count; i++) {
      const transaction = this.#undoStack.pop()!;
      const changes = createTransactionChanges();
      const success = transaction.undo(this.#model, changes);

      if (!success) {
        console.error("transaction undo failed");
        return;
      }

      this.#redoStack.push(transaction);
      this.emitChange(changes);
    }
  }

  public redo(count: number = 1): void {
    if (count <= 0) {
      console.error("Invalid redo count");
      return;
    }

    if (this.#redoStack.length < count) {
      console.error("Redo stack out of bounds");
      return;
    }

    for (let i = 0; i < count; i++) {
      const transaction = this.#redoStack.pop()!;
      const changes = createTransactionChanges();
      const success = transaction.do(this.#model, changes);

      if (!success) {
        console.error("transaction redo (do) failed");
        return;
      }

      this.#undoStack.push(transaction);
      if (this.#undoStack.length > this.#maxUndoHistory) {
        this.#undoStack.shift();
      }

      this.emitChange(changes);
    }
  }
}
