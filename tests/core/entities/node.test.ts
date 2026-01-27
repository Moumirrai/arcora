import { describe, it, expect } from "vitest";
import { Node } from "../../../src/core/entities/node";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Node class", () => {
  it("generates a uuid v4 id when none provided", () => {
    const node = new Node({ coords: { x: 1, z: 2 } });
    expect(typeof node.id).toBe("string");
    expect(node.id.length).toBeGreaterThan(0);
    expect(UUID_V4_REGEX.test(node.id)).toBe(true);

    // ensure uniqueness across multiple instances (very small chance of collision)
    const node2 = new Node({ coords: { x: 3, z: 4 } });
    expect(node2.id).not.toBe(node.id);
    expect(UUID_V4_REGEX.test(node2.id)).toBe(true);
  });

  it("keeps a provided id", () => {
    const node = new Node({ coords: { x: 0, z: 0 }, id: "custom-id-123" });
    expect(node.id).toBe("custom-id-123");
  });

  it("pos getter returns coordinates and returned object is independent", () => {
    const node = new Node({ coords: { x: 5, z: 6 } });
    const pos = node.pos;
    expect(pos).toEqual({ x: 5, z: 6 });

    // Mutate returned object should not change internal coords
    (pos.x as any) = 9999;
    expect(node.pos).toEqual({ x: 5, z: 6 });
  });

  it("pos setter updates coords and sets dirty; cleanDirty clears it", () => {
    const node = new Node({ coords: { x: 1, z: 2 } });
    expect(node.dirty).toBe(false);

    node.pos = { x: 10, z: 20 };
    expect(node.pos).toEqual({ x: 10, z: 20 });
    expect(node.dirty).toBe(true);

    node.cleanDirty();
    expect(node.dirty).toBe(false);
  });

  it("toData includes optional fields when present and omits when absent", () => {
    const initDisp = { x: 7, z: 8 };
    const node = new Node({
      coords: { x: 3, z: 4 },
      id: "id-1",
      initialDisplacement: initDisp,
      name: "Node A",
    });

    const data = node.toData();
    expect(data.id).toBe("id-1");
    expect(data.coords).toEqual({ x: 3, z: 4 });
    expect(data.initialDisplacement).toBe(initDisp); // reference preserved
    expect(data.name).toBe("Node A");

    // Modifying returned coords should not change node's internal coords
    (data.coords as any).x = -999;
    expect(node.pos).toEqual({ x: 3, z: 4 });

    const node2 = new Node({ coords: { x: 0, z: 0 }, id: "id-2" });
    const data2 = node2.toData();
    expect(data2.id).toBe("id-2");
    expect(data2.coords).toEqual({ x: 0, z: 0 });
    expect((data2 as any).name).toBeUndefined();
    expect((data2 as any).initialDisplacement).toBeUndefined();
  });

  it("toData serializes and deserializes correctly", () => {
    const initDisp = { x: 7, z: 8 };
    const node = new Node({
      coords: { x: 3, z: 4 },
      initialDisplacement: initDisp,
      name: "Node A",
    });

    const data = node.toData();

    const node2 = new Node(data);
    expect(node2.id).toBe(node.id);
    expect(node2.pos).toEqual(node.pos);
    expect(node2.name).toBe("Node A");
  });
});
