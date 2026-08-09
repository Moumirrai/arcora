import {
  systemCreate,
  systemRowsPtr,
  systemColsPtr,
  systemValsPtr,
  systemBPtr,
  systemXPtr,
  systemSetNnz,
  systemResize,
  systemDestroy,
  systemSolve,
  memory,
} from "@arcora/wasm";

export class SparseSolver {
  #handle: number;
  #n: number;
  #capacity: number;
  #nnz: number;

  #kDirty: boolean = true;
  #fDirty: boolean = true;

  constructor(n: number, capacity: number) {
    const handle = systemCreate(n, capacity);
    if (handle == -1) {
      throw new Error("Failed to create sparse solver");
    }
    this.#handle = handle;
    this.#n = n;
    this.#capacity = capacity;
    this.#nnz = 0;
  }

  setTriplets(rows: Int32Array, cols: Int32Array, vals: Float64Array) {
    if (rows.length != cols.length || rows.length != vals.length) {
      throw new Error("Rows, cols and vals must have the same length");
    }
    if (rows.length > this.#capacity) {
      throw new Error("Too many non-zero entries");
    }

    const rowsPtr = systemRowsPtr(this.#handle);
    const colsPtr = systemColsPtr(this.#handle);
    const valsPtr = systemValsPtr(this.#handle);

    const rowsMem = new Int32Array(memory.buffer, rowsPtr, rows.length);
    const colsMem = new Int32Array(memory.buffer, colsPtr, cols.length);
    const valsMem = new Float64Array(memory.buffer, valsPtr, vals.length);

    rowsMem.set(rows);
    colsMem.set(cols);
    valsMem.set(vals);

    this.#nnz = rows.length;
    const success = systemSetNnz(this.#handle, this.#nnz);
    if (!success) {
      throw new Error("Failed to set non-zero count");
    }
    this.#kDirty = true;
  }

  setB(b: Float64Array) {
    if (b.length != this.#n) {
      throw new Error("b must have the same length as n");
    }

    const bPtr = systemBPtr(this.#handle);
    const bMem = new Float64Array(memory.buffer, bPtr, b.length);
    bMem.set(b);

    this.#fDirty = true;
  }

  solve(shapeDirty: boolean = true) {
    const success = systemSolve(
      this.#handle,
      shapeDirty,
      this.#kDirty,
      this.#fDirty
    );
    if (!success) {
      throw new Error("Failed to solve the system");
    }
    this.#kDirty = false;
    this.#fDirty = false;
  }

  resize(newN: number, newCapacity: number) {
    if (newN <= 0 || newCapacity <= 0) {
      throw new Error("newN and newCapacity must be positive");
    }

    const nChanged = newN !== this.#n;
    const capChanged = newCapacity !== this.#capacity;

    if (!nChanged && !capChanged) return;

    const success = systemResize(this.#handle, newN, newCapacity);
    if (!success) {
      throw new Error("Failed to resize the system");
    }

    this.#n = newN;
    this.#capacity = newCapacity;
    this.#nnz = 0;
    this.#kDirty = true;
    this.#fDirty = true;
  }

  get x(): Float64Array {
    const xPtr = systemXPtr(this.#handle);
    return new Float64Array(memory.buffer, xPtr, this.#n);
  }

  destroy() {
    systemDestroy(this.#handle);
    this.#handle = -1;
    this.#n = 0;
    this.#capacity = 0;
    this.#nnz = 0;
  }
}
