import type { Model } from "../core/model";
import type { IOperation } from "./operations/IOperation";

export class Transaction {
  private commands: IOperation[] = []; // ordered list of operations
  public readonly name: string; // name of the transaction to be displayed in the UI
  public timestamp?: number;

  constructor(name: string) {
    this.name = name;
  }

  addCommand(command: IOperation) {
    this.commands.push(command);
  }

  do(model: Model): boolean {
    this.timestamp = Date.now();

    for (const command of this.commands) {
      const commandSuccess = command.do(model);
      if (!commandSuccess) {
        console.error(`Command failed: ${command.constructor.name}`);
        return false;
      }
    }
    return true;
  }

  undo(model: Model): boolean {
    this.timestamp = Date.now();
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const command = this.commands[i]!;
      const commandUndoSuccess = command.undo(model);
      if (!commandUndoSuccess) {
        console.error(`Undo failed for command: ${command.constructor.name}`);
        return false;
      }
    }
    return true;
  }
}
