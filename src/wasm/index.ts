import { loadWasm } from "./loader.ts";

const wasm = await loadWasm();

const exports = wasm.instance.exports as {
  memory: WebAssembly.Memory;
  add: (a: number, b: number) => number;
  system_create: (n: number, capacity: number) => number;
  system_rows_ptr: (handle: number) => number;
  system_cols_ptr: (handle: number) => number;
  system_vals_ptr: (handle: number) => number;
  system_b_ptr: (handle: number) => number;
  system_x_ptr: (handle: number) => number;
  system_set_nnz: (handle: number, nnz: number) => void;
  system_destroy: (handle: number) => void;
  system_resize: (handle: number, new_n: number) => boolean;
  system_solve: (
    handle: number,
    shape_dirty: boolean,
    k_dirty: boolean,
    f_dirty: boolean
  ) => void;
};

export const memory = exports.memory;
export const add = exports.add;
export const systemCreate = exports.system_create;
export const systemRowsPtr = exports.system_rows_ptr;
export const systemColsPtr = exports.system_cols_ptr;
export const systemValsPtr = exports.system_vals_ptr;
export const systemBPtr = exports.system_b_ptr;
export const systemXPtr = exports.system_x_ptr;
export const systemSetNnz = exports.system_set_nnz;
export const systemDestroy = exports.system_destroy;
export const systemResize = exports.system_resize;
export const systemSolve = exports.system_solve;
