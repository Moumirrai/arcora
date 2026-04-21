import { loadWasm } from "./loader.ts";

const wasm = await loadWasm();

const exports = wasm.instance.exports as {
  add: (a: number, b: number) => number;
  csparse_self_test: () => number;
};

export const add = exports.add;
export const csparseSelfTest = exports.csparse_self_test;
