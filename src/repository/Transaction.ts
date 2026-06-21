import type { Model } from "../core/model";
import type { IOperation } from "./IOperation";
import type { TransactionChanges } from "./changes";

export class Transaction {
  #commands: IOperation[] = [];
  public readonly name: string;
  public timestamp?: number;

  constructor(name: string) {
    this.name = name;
  }

  addCommand(command: IOperation) {
    this.#commands.push(command);
  }

  do(model: Model, changes: TransactionChanges): boolean {
    this.timestamp = Date.now();

    let i = 0;
    for (; i < this.#commands.length; i++) {
      const command = this.#commands[i]!;
      const result = command.do(model, changes);
      if (result instanceof Error) {
        console.error(
          `Command failed: ${command.constructor.name}: ${result.message}`
        );
        for (let j = i - 1; j >= 0; j--) {
          const rb = this.#commands[j]!.undo(model, changes);
          if (rb instanceof Error) {
            console.error(
              `Rollback failed for command: ${this.#commands[j]!.constructor.name}: ${rb.message}`
            );
          }
        }
        return false;
      }
    }
    return true;
  }

  undo(model: Model, changes: TransactionChanges): boolean {
    this.timestamp = Date.now();
    let i = this.#commands.length - 1;
    for (; i >= 0; i--) {
      const command = this.#commands[i]!;
      const result = command.undo(model, changes);
      if (result instanceof Error) {
        console.error(
          `Undo failed for command: ${command.constructor.name}: ${result.message}`
        );
        for (let j = i + 1; j < this.#commands.length; j++) {
          const rr = this.#commands[j]!.do(model, changes);
          if (rr instanceof Error) {
            console.error(
              `Rollback after undo failure failed for command: ${this.#commands[j]!.constructor.name}: ${rr.message}`
            );
          }
        }
        return false;
      }
    }
    return true;
  }
}
