import { bench, describe } from "vitest";
import { add } from "../../lib/index";

describe("add", () => {
    bench("add two small numbers", () => {
        add(3, 4);
    });
});