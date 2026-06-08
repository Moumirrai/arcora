import type { Model } from "@arcora/core/model";

export interface IOperation {
  do(model: Model): boolean; // returns true if the operation was successful
  undo(model: Model): boolean;
}
