import { describe, it, expect } from "vitest";
import { Matrix, Vector } from "@algebra";

describe("Matrix", () => {
  describe("constructor", () => {
    it("creates matrix with correct dimensions and initializes to zeros", () => {
      const m = new Matrix(3, 4);
      expect(m.rows).toBe(3);
      expect(m.cols).toBe(4);
      expect(m.data.length).toBe(12);
      expect(m.data.every((v) => v === 0)).toBe(true);
    });

    it("creates matrix from 2D array data", () => {
      const data = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const m = new Matrix(2, 3, data);
      expect(m.rows).toBe(2);
      expect(m.cols).toBe(3);
      expect(m.at(0, 0)).toBe(1);
      expect(m.at(0, 1)).toBe(2);
      expect(m.at(0, 2)).toBe(3);
      expect(m.at(1, 0)).toBe(4);
      expect(m.at(1, 1)).toBe(5);
      expect(m.at(1, 2)).toBe(6);
    });

    it("creates matrix from flat array data", () => {
      const data = [1, 2, 3, 4, 5, 6];
      const m = new Matrix(2, 3, data);
      expect(m.rows).toBe(2);
      expect(m.cols).toBe(3);
      expect(m.at(0, 0)).toBe(1);
      expect(m.at(0, 1)).toBe(2);
      expect(m.at(0, 2)).toBe(3);
      expect(m.at(1, 0)).toBe(4);
      expect(m.at(1, 1)).toBe(5);
      expect(m.at(1, 2)).toBe(6);
    });

    it("throws on invalid shape: negative rows", () => {
      expect(() => new Matrix(-1, 2)).toThrow("Invalid matrix shape: (-1x2)");
    });

    it("throws on invalid shape: negative cols", () => {
      expect(() => new Matrix(2, -1)).toThrow("Invalid matrix shape: (2x-1)");
    });

    it("throws on invalid shape: non-integer rows", () => {
      expect(() => new Matrix(2.5, 2)).toThrow("Invalid matrix shape: (2.5x2)");
    });

    it("throws on invalid shape: non-integer cols", () => {
      expect(() => new Matrix(2, 2.5)).toThrow("Invalid matrix shape: (2x2.5)");
    });

    it("throws on 2D array with wrong number of rows", () => {
      const data = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      expect(() => new Matrix(2, 2, data)).toThrow(
        "Matrix row count mismatch: expected 2, got 3"
      );
    });

    it("throws on 2D array with wrong number of cols in row", () => {
      const data = [
        [1, 2, 3],
        [4, 5],
      ];
      expect(() => new Matrix(2, 3, data)).toThrow(
        "Matrix column count mismatch at row 1: expected 3, got 2"
      );
    });

    it("throws on flat array with wrong length", () => {
      const data = [1, 2, 3, 4, 5];
      expect(() => new Matrix(2, 3, data)).toThrow(
        "Matrix data length mismatch: expected 6, got 5"
      );
    });
  });

  describe("at", () => {
    it("gets value at valid position", () => {
      const m = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
      expect(m.at(0, 0)).toBe(1);
      expect(m.at(1, 2)).toBe(6);
    });

    it("throws on negative row", () => {
      const m = new Matrix(2, 2);
      expect(() => m.at(-1, 0)).toThrow(
        "Matrix index out of bounds: (-1, 0) for matrix of size (2x2)"
      );
    });

    it("throws on negative col", () => {
      const m = new Matrix(2, 2);
      expect(() => m.at(0, -1)).toThrow(
        "Matrix index out of bounds: (0, -1) for matrix of size (2x2)"
      );
    });

    it("throws on row >= rows", () => {
      const m = new Matrix(2, 2);
      expect(() => m.at(2, 0)).toThrow(
        "Matrix index out of bounds: (2, 0) for matrix of size (2x2)"
      );
    });

    it("throws on col >= cols", () => {
      const m = new Matrix(2, 2);
      expect(() => m.at(0, 2)).toThrow(
        "Matrix index out of bounds: (0, 2) for matrix of size (2x2)"
      );
    });
  });

  describe("setAt", () => {
    it("sets value at valid position", () => {
      const m = new Matrix(2, 3);
      m.setAt(1, 2, 42);
      expect(m.at(1, 2)).toBe(42);
    });

    it("returns this for chaining", () => {
      const m = new Matrix(2, 2);
      expect(m.setAt(0, 0, 5)).toBe(m);
    });

    it("throws on negative row", () => {
      const m = new Matrix(2, 2);
      expect(() => m.setAt(-1, 0, 5)).toThrow("Matrix index out of bounds");
    });

    it("throws on negative col", () => {
      const m = new Matrix(2, 2);
      expect(() => m.setAt(0, -1, 5)).toThrow("Matrix index out of bounds");
    });

    it("throws on row >= rows", () => {
      const m = new Matrix(2, 2);
      expect(() => m.setAt(2, 0, 5)).toThrow("Matrix index out of bounds");
    });

    it("throws on col >= cols", () => {
      const m = new Matrix(2, 2);
      expect(() => m.setAt(0, 2, 5)).toThrow("Matrix index out of bounds");
    });
  });

  describe("add", () => {
    it("static add adds two matrices correctly", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const b = new Matrix(2, 2, [5, 6, 7, 8]);
      const result = Matrix.add(a, b);
      expect(result.data).toEqual(new Float64Array([6, 8, 10, 12]));
    });

    it("instance add works", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const b = new Matrix(2, 2, [5, 6, 7, 8]);
      const result = a.add(b);
      expect(result.data).toEqual(new Float64Array([6, 8, 10, 12]));
    });

    it("uses provided output matrix", () => {
      const a = new Matrix(2, 2, [1, 0, 0, 1]);
      const b = new Matrix(2, 2, [0, 1, 0, 0]);
      const out = new Matrix(2, 2);
      const result = Matrix.add(a, b, out);
      expect(result).toBe(out);
      expect(result.data).toEqual(new Float64Array([1, 1, 0, 1]));
    });

    it("throws on mismatched shapes", () => {
      const a = new Matrix(2, 2);
      const b = new Matrix(3, 2);
      expect(() => Matrix.add(a, b)).toThrow(
        "Matrix dimensions invalid for addition: (2x2) and (3x2)"
      );
    });

    it("throws on invalid output dimensions", () => {
      const a = new Matrix(2, 2);
      const b = new Matrix(2, 2);
      const out = new Matrix(3, 3);
      expect(() => Matrix.add(a, b, out)).toThrow(
        "Matrix dimensions invalid for addition: (3x3) != (2x2)"
      );
    });
  });

  describe("sub", () => {
    it("static sub subtracts matrices correctly", () => {
      const a = new Matrix(2, 2, [5, 6, 7, 8]);
      const b = new Matrix(2, 2, [1, 2, 3, 4]);
      const result = Matrix.sub(a, b);
      expect(result.data).toEqual(new Float64Array([4, 4, 4, 4]));
    });

    it("instance sub works", () => {
      const a = new Matrix(2, 2, [5, 6, 7, 8]);
      const b = new Matrix(2, 2, [1, 2, 3, 4]);
      const result = a.sub(b);
      expect(result.data).toEqual(new Float64Array([4, 4, 4, 4]));
    });
  });

  describe("set", () => {
    it("sets matrix data", () => {
      const out = new Matrix(2, 2);
      const result = Matrix.fromArray([1, 2, 3, 4], 2, 2, out);
      expect(result).toBe(out);
      expect(result.data).toEqual(new Float64Array([1, 2, 3, 4]));
    });

    it("throws on length mismatch", () => {
      expect(() => Matrix.fromArray([1, 2, 3], 2, 2)).toThrow(
        "Matrix data length mismatch: expected 4, got 3"
      );
    });
  });

  describe("multiply", () => {
    it("multiplies two matrices correctly", () => {
      const a = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
      const b = new Matrix(3, 2, [7, 8, 9, 10, 11, 12]);
      const result = Matrix.multiply(a, b);
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
      expect(result.at(0, 0)).toBe(58); // 1*7 + 2*9 + 3*11
      expect(result.at(0, 1)).toBe(64); // 1*8 + 2*10 + 3*12
      expect(result.at(1, 0)).toBe(139); // 4*7 + 5*9 + 6*11
      expect(result.at(1, 1)).toBe(154); // 4*8 + 5*10 + 6*12
    });

    it("instance multiply works", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const b = new Matrix(2, 2, [5, 6, 7, 8]);
      const result = a.multiply(b);
      expect(result.at(0, 0)).toBe(19); // 1*5 + 2*7
      expect(result.at(0, 1)).toBe(22); // 1*6 + 2*8
      expect(result.at(1, 0)).toBe(43); // 3*5 + 4*7
      expect(result.at(1, 1)).toBe(50); // 3*6 + 4*8
    });

    it("uses provided output matrix", () => {
      const a = new Matrix(1, 1, [2]);
      const b = new Matrix(1, 1, [3]);
      const out = new Matrix(1, 1);
      const result = Matrix.multiply(a, b, out);
      expect(result).toBe(out);
      expect(result.at(0, 0)).toBe(6);
    });

    it("throws on incompatible dimensions", () => {
      const a = new Matrix(2, 3);
      const b = new Matrix(2, 2);
      expect(() => Matrix.multiply(a, b)).toThrow(
        "Matrix dimensions invalid for multiplication: (2x3) * (2x2)"
      );
    });

    it("throws on invalid output dimensions", () => {
      const a = new Matrix(2, 2);
      const b = new Matrix(2, 2);
      const out = new Matrix(1, 1);
      expect(() => Matrix.multiply(a, b, out)).toThrow(
        "Matrix dimensions invalid for multiplication: (1x1) != (2x2)"
      );
    });

    it("throws on aliasing output with input", () => {
      const a = new Matrix(2, 2);
      expect(() => Matrix.multiply(a, a, a)).toThrow(
        "Aliasing not supported for matrix multiplication"
      );
    });
  });

  describe("vecMult", () => {
    it("multiplies matrix and vector correctly", () => {
      const m = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
      const v = new Vector(3, [1, 2, 3]);
      const result = Matrix.vecMult(m, v);
      expect(result.size).toBe(2);
      expect(result.data[0]).toBe(14); // 1*1 + 2*2 + 3*3
      expect(result.data[1]).toBe(32); // 4*1 + 5*2 + 6*3
    });

    it("instance vecMult works", () => {
      const m = new Matrix(2, 2, [1, 2, 3, 4]);
      const v = new Vector(2, [5, 6]);
      const result = m.vecMult(v);
      expect(result.data[0]).toBe(17); // 1*5 + 2*6
      expect(result.data[1]).toBe(39); // 3*5 + 4*6
    });

    it("uses provided output vector", () => {
      const m = new Matrix(1, 1, [2]);
      const v = new Vector(1, [3]);
      const out = new Vector(1);
      const result = Matrix.vecMult(m, v, out);
      expect(result).toBe(out);
      expect(result.data[0]).toBe(6);
    });

    it("throws on incompatible dimensions", () => {
      const m = new Matrix(2, 3);
      const v = new Vector(2);
      expect(() => Matrix.vecMult(m, v)).toThrow(
        "Matrix dimensions invalid for multiplication: (2x3) * (2x1)"
      );
    });

    it("throws on invalid output size", () => {
      const m = new Matrix(2, 2);
      const v = new Vector(2);
      const out = new Vector(3);
      expect(() => Matrix.vecMult(m, v, out)).toThrow(
        "Output vector has invalid dimensions: 3 != 2"
      );
    });

    it("throws on aliasing output with input vector", () => {
      const m = new Matrix(2, 2);
      const v = new Vector(2);
      expect(() => Matrix.vecMult(m, v, v)).toThrow(
        "Aliasing not supported for matrix-vector multiplication"
      );
    });
  });

  describe("transpose", () => {
    it("transposes matrix correctly", () => {
      const a = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
      const result = Matrix.transpose(a);
      expect(result.rows).toBe(3);
      expect(result.cols).toBe(2);
      expect(result.data).toEqual(new Float64Array([1, 4, 2, 5, 3, 6]));
    });

    it("instance transpose works", () => {
      const a = new Matrix(3, 2, [1, 4, 2, 5, 3, 6]);
      const result = a.transpose();
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(3);
      expect(result.data).toEqual(new Float64Array([1, 2, 3, 4, 5, 6]));
    });

    it("uses provided output matrix", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const out = new Matrix(2, 2);
      const result = Matrix.transpose(a, out);
      expect(result).toBe(out);
      expect(result.data).toEqual(new Float64Array([1, 3, 2, 4]));
    });

    it("throws on invalid output dimensions", () => {
      const a = new Matrix(2, 3);
      const out = new Matrix(3, 3);
      expect(() => Matrix.transpose(a, out)).toThrow(
        "Matrix dimensions invalid for transpose: (3x3) != (3x2)"
      );
    });

    it("throws on in-place transpose", () => {
      const a = new Matrix(2, 2);
      expect(() => Matrix.transpose(a, a)).toThrow(
        "In-place transpose is not supported"
      );
    });
  });

  describe("identity", () => {
    it("creates identity matrix", () => {
      const id = Matrix.identity(3);
      expect(id.rows).toBe(3);
      expect(id.cols).toBe(3);
      expect(id.at(0, 0)).toBe(1);
      expect(id.at(0, 1)).toBe(0);
      expect(id.at(1, 1)).toBe(1);
      expect(id.at(2, 2)).toBe(1);
    });

    it("uses provided output matrix", () => {
      const out = new Matrix(2, 2);
      const result = Matrix.identity(2, out);
      expect(result).toBe(out);
      expect(result.at(0, 0)).toBe(1);
      expect(result.at(1, 1)).toBe(1);
    });

    it("throws on invalid output dimensions", () => {
      const out = new Matrix(2, 3);
      expect(() => Matrix.identity(2, out)).toThrow(
        "Matrix dimensions invalid for identity: (2x3) != (2x2)"
      );
    });
  });

  describe("clone", () => {
    it("clones matrix", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const clone = Matrix.clone(a);
      expect(clone.data).toEqual(a.data);
      expect(clone).not.toBe(a);
    });

    it("instance clone works", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const clone = a.clone();
      expect(clone.data).toEqual(a.data);
    });

    it("uses provided output matrix", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const out = new Matrix(2, 2);
      const result = Matrix.clone(a, out);
      expect(result).toBe(out);
      expect(result.data).toEqual(a.data);
    });

    it("throws on invalid output dimensions", () => {
      const a = new Matrix(2, 2);
      const out = new Matrix(3, 3);
      expect(() => Matrix.clone(a, out)).toThrow(
        "Matrix dimensions invalid for clone: (3x3) != (2x2)"
      );
    });
  });

  describe("fromBlocks", () => {
    it("constructs matrix from single block", () => {
      const block = new Matrix(2, 2, [1, 2, 3, 4]);
      const result = Matrix.fromBlocks([[block]]);
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
      expect(result.data).toEqual(new Float64Array([1, 2, 3, 4]));
    });

    it("constructs matrix from multiple blocks", () => {
      const a = new Matrix(2, 2, [1, 2, 3, 4]);
      const b = new Matrix(2, 2, [5, 6, 7, 8]);
      const result = Matrix.fromBlocks([[a, b]]);
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(4);
      expect(result.data).toEqual(new Float64Array([1, 2, 5, 6, 3, 4, 7, 8]));
    });

    it("constructs complex block matrix", () => {
      const m3x3 = new Matrix(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const m3x1 = new Matrix(3, 1, [10, 11, 12]);
      const m1x3 = new Matrix(1, 3, [13, 14, 15]);
      const m1x1 = new Matrix(1, 1, [16]);
      const result = Matrix.fromBlocks([
        [m3x3, m3x1],
        [m1x3, m1x1],
      ]);
      expect(result.rows).toBe(4);
      expect(result.cols).toBe(4);
      expect(result.at(0, 0)).toBe(1);
      expect(result.at(2, 2)).toBe(9);
      expect(result.at(0, 3)).toBe(10);
      expect(result.at(3, 0)).toBe(13);
      expect(result.at(3, 3)).toBe(16);
    });

    it("uses provided output matrix", () => {
      const block = new Matrix(1, 1, [42]);
      const out = new Matrix(1, 1);
      const result = Matrix.fromBlocks([[block]], out);
      expect(result).toBe(out);
      expect(result.at(0, 0)).toBe(42);
    });

    it("throws on empty blocks", () => {
      expect(() => Matrix.fromBlocks([])).toThrow(
        "fromBlocks: blocks must not be empty"
      );
    });

    it("throws on empty block row", () => {
      expect(() => Matrix.fromBlocks([[]])).toThrow(
        "fromBlocks: block rows must not be empty"
      );
    });

    it("throws on incompatible block sizes in row", () => {
      const a = new Matrix(2, 2);
      const b = new Matrix(3, 2);
      expect(() => Matrix.fromBlocks([[a, b]])).toThrow(
        "fromBlocks: block (0,1) is 3x2, expected 2x2"
      );
    });

    it("throws on invalid output dimensions", () => {
      const block = new Matrix(2, 2);
      const out = new Matrix(3, 3);
      expect(() => Matrix.fromBlocks([[block]], out)).toThrow(
        "Matrix dimensions invalid for fromBlocks: (3x3) != (2x2)"
      );
    });
  });

  describe("submatrix", () => {
    it("extracts submatrix correctly", () => {
      const a = new Matrix(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const result = Matrix.submatrix(a, 1, 3, 1, 3);
      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
      expect(result.data).toEqual(new Float64Array([5, 6, 8, 9]));
    });

    it("instance submatrix works", () => {
      const a = new Matrix(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const result = a.submatrix(0, 2, 0, 2);
      expect(result.data).toEqual(new Float64Array([1, 2, 4, 5]));
    });

    it("uses provided output matrix", () => {
      const a = new Matrix(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const out = new Matrix(2, 2);
      const result = Matrix.submatrix(a, 1, 3, 1, 3, out);
      expect(result).toBe(out);
      expect(result.data).toEqual(new Float64Array([5, 6, 8, 9]));
    });

    it("throws on out of bounds", () => {
      const a = new Matrix(3, 3);
      expect(() => Matrix.submatrix(a, 0, 4, 0, 3)).toThrow(
        "Matrix submatrix out of bounds: rows [0, 4), cols [0, 3) for (3x3)"
      );
    });

    it("throws on invalid indices", () => {
      const a = new Matrix(3, 3);
      expect(() => Matrix.submatrix(a, 2, 1, 0, 2)).toThrow(
        "Matrix submatrix out of bounds"
      );
    });

    it("throws on invalid output dimensions", () => {
      const a = new Matrix(3, 3);
      const out = new Matrix(1, 1);
      expect(() => Matrix.submatrix(a, 1, 3, 1, 3, out)).toThrow(
        "Matrix dimensions invalid for submatrix: (1x1) != (2x2)"
      );
    });

    it("throws on aliasing output with input", () => {
      const a = new Matrix(2, 2);
      expect(() => Matrix.submatrix(a, 0, 2, 0, 2, a)).toThrow(
        "Aliasing not supported for submatrix extraction"
      );
    });
  });

  describe("toString", () => {
    it("formats matrix as string", () => {
      const m = new Matrix(2, 2, [1.123, 2.456, 3.789, 4.012]);
      const str = m.toString();
      expect(str).toContain("Matrix(2x2):");
      expect(str).toContain(" 1.12");
      expect(str).toContain(" 2.46");
      expect(str).toContain(" 3.79");
      expect(str).toContain(" 4.01");
    });
  });
});
