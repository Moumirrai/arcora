import { describe, it, expect } from "vitest";
import { Vector } from "../../../src/core/algebra";

describe("Vector", () => {
  describe("constructor", () => {
    it("creates zero-filled vector with size", () => {
      const v = new Vector(3);
      expect(v.size).toBe(3);
      expect(Array.from(v.data)).toEqual([0, 0, 0]);
    });

    it("creates vector from data", () => {
      const v = new Vector(3, [1, 2, 3]);
      expect(Array.from(v.data)).toEqual([1, 2, 3]);
    });

    it("throws on data length mismatch", () => {
      expect(() => new Vector(3, [1, 2])).toThrow(
        "Vector data length mismatch"
      );
    });
  });

  describe("fromArray", () => {
    it("creates vector from array", () => {
      const v = Vector.fromArray([1, 2, 3]);
      expect(v.size).toBe(3);
      expect(Array.from(v.data)).toEqual([1, 2, 3]);
    });

    it("works with typed arrays", () => {
      const arr = new Float32Array([4, 5, 6]);
      const v = Vector.fromArray(arr);
      expect(Array.from(v.data)).toEqual([4, 5, 6]);
    });
  });

  describe("like", () => {
    it("creates zero vector with same size", () => {
      const a = new Vector(4, [1, 2, 3, 4]);
      const b = Vector.like(a);
      expect(b.size).toBe(4);
      expect(Array.from(b.data)).toEqual([0, 0, 0, 0]);
    });
  });

  describe("clone", () => {
    it("creates independent copy", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = a.clone();
      expect(Array.from(b.data)).toEqual([1, 2, 3]);
      b.data[0] = 99;
      expect(a.data[0]).toBe(1);
    });

    it("clones into provided vector", () => {
      const a = new Vector(3, [1, 2, 3]);
      const out = new Vector(3);
      const result = a.clone(out);
      expect(result).toBe(out);
      expect(Array.from(out.data)).toEqual([1, 2, 3]);
    });
  });

  describe("fill", () => {
    it("fills all elements", () => {
      const v = new Vector(4);
      v.fill(7);
      expect(Array.from(v.data)).toEqual([7, 7, 7, 7]);
    });

    it("returns this for chaining", () => {
      const v = new Vector(2);
      expect(v.fill(0)).toBe(v);
    });
  });

  describe("at / setAt", () => {
    it("gets element at index", () => {
      const v = new Vector(3, [1, 2, 3]);
      expect(v.at(0)).toBe(1);
      expect(v.at(2)).toBe(3);
    });

    it("throws on out of bounds get", () => {
      const v = new Vector(3);
      expect(() => v.at(-1)).toThrow("Vector index out of bounds");
      expect(() => v.at(3)).toThrow("Vector index out of bounds");
    });

    it("sets element at index", () => {
      const v = new Vector(3);
      v.setAt(1, 42);
      expect(v.at(1)).toBe(42);
    });

    it("throws on out of bounds set", () => {
      const v = new Vector(3);
      expect(() => v.setAt(-1, 1)).toThrow("Vector index out of bounds");
      expect(() => v.setAt(3, 1)).toThrow("Vector index out of bounds");
    });

    it("setAt returns this for chaining", () => {
      const v = new Vector(2);
      expect(v.setAt(0, 5)).toBe(v);
    });
  });

  describe("copy", () => {
    it("copies to new vector", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = a.copy();
      expect(Array.from(b.data)).toEqual([1, 2, 3]);
      expect(b).not.toBe(a);
    });

    it("copies to existing vector", () => {
      const a = new Vector(3, [1, 2, 3]);
      const out = new Vector(3);
      const result = a.copy(out);
      expect(result).toBe(out);
      expect(Array.from(out.data)).toEqual([1, 2, 3]);
    });

    it("throws on dimension mismatch", () => {
      const a = new Vector(3);
      const b = new Vector(2);
      expect(() => Vector.copy(a, b)).toThrow(
        "Vector dimensions invalid for copy"
      );
    });
  });

  describe("add", () => {
    it("adds two vectors", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = new Vector(3, [4, 5, 6]);
      const c = Vector.add(a, b);
      expect(Array.from(c.data)).toEqual([5, 7, 9]);
    });

    it("adds via instance method", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = new Vector(3, [4, 5, 6]);
      const c = a.add(b);
      expect(Array.from(c.data)).toEqual([5, 7, 9]);
    });

    it("adds into output vector", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = new Vector(3, [4, 5, 6]);
      const out = new Vector(3);
      const result = Vector.add(a, b, out);
      expect(result).toBe(out);
      expect(Array.from(out.data)).toEqual([5, 7, 9]);
    });

    it("throws on size mismatch", () => {
      const a = new Vector(3);
      const b = new Vector(2);
      expect(() => Vector.add(a, b)).toThrow(
        "Vector dimensions invalid for addition"
      );
    });

    it("throws on output size mismatch", () => {
      const a = new Vector(3);
      const b = new Vector(3);
      const out = new Vector(2);
      expect(() => Vector.add(a, b, out)).toThrow(
        "Vector dimensions invalid for addition"
      );
    });
  });

  describe("sub", () => {
    it("subtracts two vectors", () => {
      const a = new Vector(3, [5, 7, 9]);
      const b = new Vector(3, [1, 2, 3]);
      const c = Vector.sub(a, b);
      expect(Array.from(c.data)).toEqual([4, 5, 6]);
    });

    it("subtracts via instance method", () => {
      const a = new Vector(3, [5, 7, 9]);
      const b = new Vector(3, [1, 2, 3]);
      const c = a.sub(b);
      expect(Array.from(c.data)).toEqual([4, 5, 6]);
    });

    it("subtracts into output vector", () => {
      const a = new Vector(3, [5, 7, 9]);
      const b = new Vector(3, [1, 2, 3]);
      const out = new Vector(3);
      const result = Vector.sub(a, b, out);
      expect(result).toBe(out);
      expect(Array.from(out.data)).toEqual([4, 5, 6]);
    });

    it("throws on size mismatch", () => {
      const a = new Vector(3);
      const b = new Vector(2);
      expect(() => Vector.sub(a, b)).toThrow(
        "Vector dimensions invalid for subtraction"
      );
    });
  });

  describe("scale", () => {
    it("scales vector by scalar", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = Vector.scale(a, 2);
      expect(Array.from(b.data)).toEqual([2, 4, 6]);
    });

    it("scales via instance method", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = a.scale(3);
      expect(Array.from(b.data)).toEqual([3, 6, 9]);
    });

    it("scales into output vector", () => {
      const a = new Vector(3, [1, 2, 3]);
      const out = new Vector(3);
      const result = Vector.scale(a, 0.5, out);
      expect(result).toBe(out);
      expect(Array.from(out.data)).toEqual([0.5, 1, 1.5]);
    });

    it("throws on output size mismatch", () => {
      const a = new Vector(3);
      const out = new Vector(2);
      expect(() => Vector.scale(a, 2, out)).toThrow(
        "Vector dimensions invalid for scale"
      );
    });
  });

  describe("dot", () => {
    it("computes dot product", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = new Vector(3, [4, 5, 6]);
      expect(Vector.dot(a, b)).toBe(32); // 1*4 + 2*5 + 3*6
    });

    it("computes dot via instance method", () => {
      const a = new Vector(3, [1, 2, 3]);
      const b = new Vector(3, [4, 5, 6]);
      expect(a.dot(b)).toBe(32);
    });

    it("returns 0 for orthogonal vectors", () => {
      const a = new Vector(2, [1, 0]);
      const b = new Vector(2, [0, 1]);
      expect(a.dot(b)).toBe(0);
    });

    it("throws on size mismatch", () => {
      const a = new Vector(3);
      const b = new Vector(2);
      expect(() => Vector.dot(a, b)).toThrow(
        "Vector dimensions invalid for dot product"
      );
    });
  });

  describe("magnitude", () => {
    it("computes magnitude squared", () => {
      const v = new Vector(3, [3, 4, 0]);
      expect(Vector.magnitudeSq(v)).toBe(25); // 3² + 4² = 25
    });

    it("computes magnitude squared via instance method", () => {
      const v = new Vector(3, [3, 4, 0]);
      expect(v.magnitudeSq()).toBe(25);
    });

    it("computes magnitude", () => {
      const v = new Vector(3, [3, 4, 0]);
      expect(Vector.magnitude(v)).toBe(5); // √25 = 5
    });

    it("computes magnitude via instance method", () => {
      const v = new Vector(3, [3, 4, 0]);
      expect(v.magnitude()).toBe(5);
    });

    it("handles zero vector", () => {
      const v = new Vector(3);
      expect(v.magnitude()).toBe(0);
    });
  });

  describe("normalize", () => {
    it("normalizes vector to unit length", () => {
      const v = new Vector(2, [3, 4]);
      const n = Vector.normalize(v);
      expect(n.magnitude()).toBeCloseTo(1, 5);
      expect(n.data[0]).toBeCloseTo(0.6, 5);
      expect(n.data[1]).toBeCloseTo(0.8, 5);
    });

    it("normalizes via instance method", () => {
      const v = new Vector(2, [3, 4]);
      const n = v.normalize();
      expect(n.magnitude()).toBeCloseTo(1, 5);
    });

    it("normalizes into output vector", () => {
      const v = new Vector(2, [3, 4]);
      const out = new Vector(2);
      const result = Vector.normalize(v, out);
      expect(result).toBe(out);
      expect(out.magnitude()).toBeCloseTo(1, 5);
    });

    it("handles zero vector", () => {
      const v = new Vector(3);
      const n = Vector.normalize(v);
      expect(Array.from(n.data)).toEqual([0, 0, 0]);
    });

    it("throws on output size mismatch", () => {
      const v = new Vector(3);
      const out = new Vector(2);
      expect(() => Vector.normalize(v, out)).toThrow(
        "Vector dimensions invalid for normalize"
      );
    });
  });

  describe("toRowMatrix", () => {
    it("transposes to row matrix", () => {
      const v = new Vector(3, [1, 2, 3]);
      const m = v.toRowMatrix();
      expect(m.rows).toBe(1);
      expect(m.cols).toBe(3);
    });
  });

  describe("method chaining", () => {
    it("chains multiple operations", () => {
      const v = new Vector(2, [1, 2]);
      const result = v.scale(2).add(new Vector(2, [1, 1]));
      expect(Array.from(result.data)).toEqual([3, 5]);
    });
  });

  describe("edge cases", () => {
    it("handles single element vector", () => {
      const v = new Vector(1, [42]);
      expect(v.magnitude()).toBe(42);
      expect(v.dot(v)).toBe(1764);
    });

    it("handles large vectors", () => {
      const size = 10000;
      const v = Vector.fromArray(Array.from({ length: size }, (_, i) => i));
      expect(v.size).toBe(size);
      expect(v.at(9999)).toBe(9999);
    });

    it("handles negative values", () => {
      const a = new Vector(3, [-1, -2, -3]);
      const b = new Vector(3, [1, 2, 3]);
      const c = a.add(b);
      expect(Array.from(c.data)).toEqual([0, 0, 0]);
    });
  });
});
