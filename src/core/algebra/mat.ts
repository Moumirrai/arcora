import { Vector } from "./vec";

type MatrixDataLike = ArrayLike<number> | number[][];

export class Matrix {
  public readonly data: Float64Array;

  constructor(
    public readonly rows: number,
    public readonly cols: number,
    data?: MatrixDataLike
  ) {
    Matrix.assertValidShape(rows, cols);

    this.data = new Float64Array(rows * cols);

    if (data !== undefined) {
      if (
        Array.isArray(data) &&
        (data.length === 0 || Array.isArray(data[0]))
      ) {
        const src = data as number[][];

        if (src.length !== rows) {
          throw new Error(
            `Matrix row count mismatch: expected ${rows}, got ${src.length}`
          );
        }

        let p = 0;
        for (let i = 0; i < rows; i++) {
          const row = src[i]!;
          if (row.length !== cols) {
            throw new Error(
              `Matrix column count mismatch at row ${i}: expected ${cols}, got ${row.length}`
            );
          }

          for (let j = 0; j < cols; j++) {
            this.data[p++] = row[j]!;
          }
        }
      } else {
        const src = data as ArrayLike<number>;
        if (src.length !== rows * cols) {
          throw new Error(
            `Matrix data length mismatch: expected ${rows * cols}, got ${src.length}`
          );
        }

        this.data.set(src);
      }
    }
  }

  private static assertValidShape(rows: number, cols: number): void {
    if (
      !Number.isInteger(rows) ||
      !Number.isInteger(cols) ||
      rows < 0 ||
      cols < 0
    ) {
      throw new Error(`Invalid matrix shape: (${rows}x${cols})`);
    }
  }

  private static assertSameShape(a: Matrix, b: Matrix, op: string): void {
    if (a.rows !== b.rows || a.cols !== b.cols) {
      throw new Error(
        `Matrix dimensions invalid for ${op}: (${a.rows}x${a.cols}) and (${b.rows}x${b.cols})`
      );
    }
  }

  private static assertOutputShape(
    out: Matrix,
    rows: number,
    cols: number,
    op: string
  ): void {
    if (out.rows !== rows || out.cols !== cols) {
      throw new Error(
        `Matrix dimensions invalid for ${op}: (${out.rows}x${out.cols}) != (${rows}x${cols})`
      );
    }
  }

  at(row: number, col: number): number {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new RangeError(
        `Matrix index out of bounds: (${row}, ${col}) for matrix of size (${this.rows}x${this.cols})`
      );
    }

    return this.data[row * this.cols + col]!;
  }

  setAt(row: number, col: number, value: number): this {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new RangeError(
        `Matrix index out of bounds: (${row}, ${col}) for matrix of size (${this.rows}x${this.cols})`
      );
    }

    this.data[row * this.cols + col] = value;
    return this;
  }

  add(b: Matrix, out?: Matrix): Matrix {
    return Matrix.add(this, b, out);
  }

  sub(b: Matrix, out?: Matrix): Matrix {
    return Matrix.sub(this, b, out);
  }

  multiply(b: Matrix, out?: Matrix): Matrix {
    return Matrix.multiply(this, b, out);
  }

  vecMult(v: Vector, out?: Vector): Vector {
    return Matrix.vecMult(this, v, out);
  }

  transpose(out?: Matrix): Matrix {
    return Matrix.transpose(this, out);
  }

  clone(out?: Matrix): Matrix {
    return Matrix.clone(this, out);
  }

  submatrix(
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number,
    out?: Matrix
  ): Matrix {
    return Matrix.submatrix(this, rowStart, rowEnd, colStart, colEnd, out);
  }

  static add(a: Matrix, b: Matrix, out?: Matrix): Matrix {
    Matrix.assertSameShape(a, b, "addition");

    const r = out ?? new Matrix(a.rows, a.cols);
    Matrix.assertOutputShape(r, a.rows, a.cols, "addition");

    const ad = a.data;
    const bd = b.data;
    const rd = r.data;
    const n = ad.length;

    for (let i = 0; i < n; i++) {
      rd[i] = ad[i]! + bd[i]!;
    }

    return r;
  }

  static sub(a: Matrix, b: Matrix, out?: Matrix): Matrix {
    Matrix.assertSameShape(a, b, "subtraction");

    const r = out ?? new Matrix(a.rows, a.cols);
    Matrix.assertOutputShape(r, a.rows, a.cols, "subtraction");

    const ad = a.data;
    const bd = b.data;
    const rd = r.data;
    const n = ad.length;

    for (let i = 0; i < n; i++) {
      rd[i] = ad[i]! - bd[i]!;
    }

    return r;
  }

  static fromArray(
    data: ArrayLike<number>,
    rows: number,
    cols: number,
    out?: Matrix
  ): Matrix {
    Matrix.assertValidShape(rows, cols);

    if (data.length !== rows * cols) {
      throw new Error(
        `Matrix data length mismatch: expected ${rows * cols}, got ${data.length}`
      );
    }

    const r = out ?? new Matrix(rows, cols);
    Matrix.assertOutputShape(r, rows, cols, "set");
    r.data.set(data);
    return r;
  }

  static multiply(a: Matrix, b: Matrix, out?: Matrix): Matrix {
    const aRows = a.rows;
    const aCols = a.cols;
    const bRows = b.rows;
    const bCols = b.cols;

    if (aCols !== bRows) {
      throw new Error(
        `Matrix dimensions invalid for multiplication: (${aRows}x${aCols}) * (${bRows}x${bCols})`
      );
    }

    const r = out ?? new Matrix(aRows, bCols);
    if (r.rows !== aRows || r.cols !== bCols) {
      throw new Error(
        `Matrix dimensions invalid for multiplication: (${r.rows}x${r.cols}) != (${aRows}x${bCols})`
      );
    }

    if (r === a || r === b) {
      throw new Error("Aliasing not supported for matrix multiplication");
    }

    const ad = a.data;
    const bd = b.data;
    const rd = r.data;

    for (let i = 0; i < aRows; i++) {
      const aRowOffset = i * aCols;
      const rRowOffset = i * bCols;

      for (let j = 0; j < bCols; j++) {
        let sum = 0;
        for (let k = 0; k < aCols; k++) {
          sum += ad[aRowOffset + k]! * bd[k * bCols + j]!;
        }
        rd[rRowOffset + j] = sum;
      }
    }

    return r;
  }

  static vecMult(a: Matrix, v: Vector, out?: Vector): Vector {
    const aRows = a.rows;
    const aCols = a.cols;

    if (aCols !== v.size) {
      throw new Error(
        `Matrix dimensions invalid for multiplication: (${aRows}x${aCols}) * (${v.size}x1)`
      );
    }

    const r = out ?? new Vector(aRows);
    if (r.size !== aRows) {
      throw new Error(
        `Output vector has invalid dimensions: ${r.size} != ${aRows}`
      );
    }

    if (r === v) {
      throw new Error(
        "Aliasing not supported for matrix-vector multiplication"
      );
    }

    const ad = a.data;
    const vd = v.data;
    const rd = r.data;

    for (let i = 0; i < aRows; i++) {
      const rowOffset = i * aCols;
      let sum = 0;

      for (let k = 0; k < aCols; k++) {
        sum += ad[rowOffset + k]! * vd[k]!;
      }

      rd[i] = sum;
    }

    return r;
  }

  static transpose(a: Matrix, out?: Matrix): Matrix {
    const aRows = a.rows;
    const aCols = a.cols;

    const r = out ?? new Matrix(aCols, aRows);
    Matrix.assertOutputShape(r, aCols, aRows, "transpose");

    if (r === a) {
      throw new Error("In-place transpose is not supported");
    }

    const ad = a.data;
    const rd = r.data;
    const rCols = r.cols;

    for (let i = 0; i < aRows; i++) {
      const aRowOffset = i * aCols;
      for (let j = 0; j < aCols; j++) {
        rd[j * rCols + i] = ad[aRowOffset + j]!;
      }
    }

    return r;
  }

  static identity(size: number, out?: Matrix): Matrix {
    Matrix.assertValidShape(size, size);

    const r = out ?? new Matrix(size, size);
    Matrix.assertOutputShape(r, size, size, "identity");

    r.data.fill(0);
    for (let i = 0; i < size; i++) {
      r.data[i * size + i] = 1;
    }

    return r;
  }

  static clone(a: Matrix, out?: Matrix): Matrix {
    const r = out ?? new Matrix(a.rows, a.cols);
    Matrix.assertOutputShape(r, a.rows, a.cols, "clone");
    r.data.set(a.data);
    return r;
  }

  static fromBlocks(blocks: Matrix[][], out?: Matrix): Matrix {
    if (blocks.length === 0) {
      throw new Error("fromBlocks: blocks must not be empty");
    }
    if (blocks[0]!.length === 0) {
      throw new Error("fromBlocks: block rows must not be empty");
    }

    const blockRows = blocks.length;
    const blockCols = blocks[0]!.length;

    for (let i = 0; i < blockRows; i++) {
      if (blocks[i]!.length !== blockCols) {
        throw new Error(
          `fromBlocks: inconsistent block column count at row ${i}`
        );
      }
    }

    const rowHeights = blocks.map((row) => row[0]!.rows);
    const colWidths = blocks[0]!.map((b) => b.cols);

    const totalRows = rowHeights.reduce((s, h) => s + h, 0);
    const totalCols = colWidths.reduce((s, w) => s + w, 0);

    const r = out ?? new Matrix(totalRows, totalCols);
    Matrix.assertOutputShape(r, totalRows, totalCols, "fromBlocks");

    const rd = r.data;
    const rCols = r.cols;

    let rowOff = 0;
    for (let bi = 0; bi < blockRows; bi++) {
      let colOff = 0;

      for (let bj = 0; bj < blockCols; bj++) {
        const b = blocks[bi]![bj]!;

        if (b.rows !== rowHeights[bi] || b.cols !== colWidths[bj]) {
          throw new Error(
            `fromBlocks: block (${bi},${bj}) is ${b.rows}x${b.cols}, expected ${rowHeights[bi]}x${colWidths[bj]}`
          );
        }

        const bd = b.data;
        const bCols = b.cols;

        for (let i = 0; i < b.rows; i++) {
          rd.set(
            bd.subarray(i * bCols, i * bCols + bCols),
            (rowOff + i) * rCols + colOff
          );
        }

        colOff += bCols;
      }

      rowOff += rowHeights[bi]!;
    }

    return r;
  }

  static submatrix(
    a: Matrix,
    rowStart: number,
    rowEnd: number,
    colStart: number,
    colEnd: number,
    out?: Matrix
  ): Matrix {
    if (
      rowStart < 0 ||
      colStart < 0 ||
      rowEnd > a.rows ||
      colEnd > a.cols ||
      rowStart >= rowEnd ||
      colStart >= colEnd
    ) {
      throw new RangeError(
        `Matrix submatrix out of bounds: rows [${rowStart}, ${rowEnd}), cols [${colStart}, ${colEnd}) for (${a.rows}x${a.cols})`
      );
    }

    const rows = rowEnd - rowStart;
    const cols = colEnd - colStart;

    const r = out ?? new Matrix(rows, cols);
    Matrix.assertOutputShape(r, rows, cols, "submatrix");

    if (r === a) {
      throw new Error("Aliasing not supported for submatrix extraction");
    }

    const ad = a.data;
    const rd = r.data;
    const aCols = a.cols;

    for (let i = 0; i < rows; i++) {
      const srcStart = (rowStart + i) * aCols + colStart;
      rd.set(ad.subarray(srcStart, srcStart + cols), i * cols);
    }

    return r;
  }

  toString(): string {
    const rows = this.rows;
    const cols = this.cols;
    const data = this.data;

    let s = `Matrix(${rows}x${cols}):\n`;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        s += data[i * cols + j]!.toFixed(2).padStart(8, " ");
      }
      s += "\n";
    }

    return s;
  }
}
