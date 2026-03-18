import { loadWasm } from "./loader.ts";

const wasm = await loadWasm();

const exports = wasm.instance.exports as {
    add: (a: number, b: number) => number;
};

export const add = exports.add;