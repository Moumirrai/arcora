import { describe, it, expect } from "vitest";
import { add, csparseSelfTest } from "../../lib/index.ts";

describe("add", () => {
    it("adds two numbers", () => {
        expect(add(2, 3)).toBe(5);
    });
    it("adds two floats", () => {
        expect(add(0.1, 0.2)).toBeCloseTo(0.3, 5);
    });
    it("runs wasm csparse self-test", () => {
        expect(csparseSelfTest()).toBe(42);
    });
});
