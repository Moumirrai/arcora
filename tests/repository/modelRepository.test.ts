import { describe, it, expect } from "vitest";
import { Model } from "@arcora/core/model";
import { ModelRepository } from "@arcora/repository/modelRepository";
import { Transaction } from "@arcora/repository/Transaction";
import { AddNodeOperation } from "@arcora/repository/operations/nodeCreate";

describe("Model repository", () => {
  it("commit add/delete, undo, redo works", () => {
    const model = new Model();
    const repo = new ModelRepository(model);

    const transaction1 = new Transaction("Add node");
    transaction1.addCommand(
      new AddNodeOperation({ x: 10, z: 20, name: "Node 1" })
    );
    transaction1.addCommand(
      new AddNodeOperation({ x: 30, z: 40, name: "Node 2" })
    );

    repo.commit(transaction1);
    expect(model.nodes.size).toBe(2);

    const transaction2 = new Transaction("Add node");
    transaction2.addCommand(
      new AddNodeOperation({ x: 50, z: 60, name: "Node 3" })
    );
    repo.commit(transaction2);
    expect(model.nodes.size).toBe(3);

    repo.undo();
    expect(model.nodes.size).toBe(2);

    repo.redo();
    expect(model.nodes.size).toBe(3);
  });
});
