import { Matrix } from "./mat";

export class Vector {
  public readonly data: Float64Array;

  constructor(
    public readonly size: number,
    data?: ArrayLike<number>
  ) {
    this.data = new Float64Array(size);
    if (data) {
      if (data.length !== size) {
        throw new Error(
          `Vector data length mismatch: expected ${size}, got ${data.length}`
        );
      }
      this.data.set(data);
    }
  }

  clone(out?: Vector): Vector {
    const r = out ?? new Vector(this.size);
    r.data.set(this.data);
    return r;
  }

  fill(value: number): this {
    this.data.fill(value);
    return this;
  }

  copy(out?: Vector): Vector {
    return Vector.copy(this, out);
  }

  add(b: Vector, out?: Vector): Vector {
    return Vector.add(this, b, out);
  }

  sub(b: Vector, out?: Vector): Vector {
    return Vector.sub(this, b, out);
  }

  scale(s: number, out?: Vector): Vector {
    return Vector.scale(this, s, out);
  }

  normalize(out?: Vector): Vector {
    return Vector.normalize(this, out);
  }

  dot(b: Vector): number {
    return Vector.dot(this, b);
  }

  magnitudeSq(): number {
    return Vector.magnitudeSq(this);
  }

  magnitude(): number {
    return Vector.magnitude(this);
  }

  toRowMatrix(): Matrix {
    return Vector.transpose(this);
  }

  at(index: number): number {
    if (index < 0 || index >= this.size) {
      throw new RangeError(`Vector index out of bounds: ${index}`);
    }
    return this.data[index]!;
  }

  setAt(index: number, value: number): this {
    if (index < 0 || index >= this.size) {
      throw new RangeError(`Vector index out of bounds: ${index}`);
    }
    this.data[index] = value;
    return this;
  }

  static fromArray(data: ArrayLike<number>): Vector {
    return new Vector(data.length, data);
  }

  static like(a: Vector): Vector {
    return new Vector(a.size);
  }

  static copy(a: Vector, out?: Vector): Vector {
    const r = out ?? new Vector(a.size);
    if (r.size !== a.size) {
      throw new Error(
        `Vector dimensions invalid for copy: (${r.size}) = (${a.size})`
      );
    }
    r.data.set(a.data);
    return r;
  }

  static add(a: Vector, b: Vector, out?: Vector): Vector {
    if (a.size !== b.size) {
      throw new Error(
        `Vector dimensions invalid for addition: (${a.size}) + (${b.size})`
      );
    }

    const r = out ?? new Vector(a.size);
    if (r.size !== a.size) {
      throw new Error(
        `Vector dimensions invalid for addition: (${r.size}) = (${a.size}) + (${b.size})`
      );
    }

    const rd = r.data;
    const ad = a.data;
    const bd = b.data;

    for (let i = 0; i < a.size; i++) {
      rd[i] = ad[i]! + bd[i]!;
    }
    return r;
  }

  static sub(a: Vector, b: Vector, out?: Vector): Vector {
    if (a.size !== b.size) {
      throw new Error(
        `Vector dimensions invalid for subtraction: (${a.size}) - (${b.size})`
      );
    }

    const r = out ?? new Vector(a.size);
    if (r.size !== a.size) {
      throw new Error(
        `Vector dimensions invalid for subtraction: (${r.size}) = (${a.size}) - (${b.size})`
      );
    }

    const rd = r.data;
    const ad = a.data;
    const bd = b.data;

    for (let i = 0; i < a.size; i++) {
      rd[i] = ad[i]! - bd[i]!;
    }
    return r;
  }

  toString(): string {
    return `Vector(${this.size}): (${this.data})`;
  }

  static scale(a: Vector, s: number, out?: Vector): Vector {
    const r = out ?? new Vector(a.size);
    if (r.size !== a.size) {
      throw new Error(
        `Vector dimensions invalid for scale: (${r.size}) = scale(${a.size})`
      );
    }

    const rd = r.data;
    const ad = a.data;

    for (let i = 0; i < a.size; i++) {
      rd[i] = ad[i]! * s;
    }
    return r;
  }

  static dot(a: Vector, b: Vector): number {
    if (a.size !== b.size) {
      throw new Error(
        `Vector dimensions invalid for dot product: (${a.size}) · (${b.size})`
      );
    }

    const ad = a.data;
    const bd = b.data;

    let sum = 0;
    for (let i = 0; i < a.size; i++) {
      sum += ad[i]! * bd[i]!;
    }
    return sum;
  }

  static magnitudeSq(a: Vector): number {
    const ad = a.data;

    let sum = 0;
    for (let i = 0; i < a.size; i++) {
      const v = ad[i]!;
      sum += v * v;
    }
    return sum;
  }

  static magnitude(a: Vector): number {
    return Math.sqrt(Vector.magnitudeSq(a));
  }

  static normalize(a: Vector, out?: Vector): Vector {
    const r = out ?? new Vector(a.size);
    if (r.size !== a.size) {
      throw new Error(
        `Vector dimensions invalid for normalize: (${r.size}) = normalize(${a.size})`
      );
    }

    const ad = a.data;
    const rd = r.data;

    let magSq = 0;
    for (let i = 0; i < a.size; i++) {
      const v = ad[i]!;
      magSq += v * v;
    }

    if (magSq === 0) {
      rd.fill(0);
      return r;
    }

    const invMag = 1 / Math.sqrt(magSq);
    for (let i = 0; i < a.size; i++) {
      rd[i] = ad[i]! * invMag;
    }
    return r;
  }

  static transpose(a: Vector): Matrix {
    const out = new Matrix(1, a.size);
    out.data.set(a.data);
    return out;
  }
}
