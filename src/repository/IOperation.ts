import type { Model } from "@arcora/core/model";
import type { TransactionChanges } from "./changes";

export interface IOperation {
  do(model: Model, changes: TransactionChanges): void | Error;
  undo(model: Model, changes: TransactionChanges): void | Error;
}
