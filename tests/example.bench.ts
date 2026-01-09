import { describe, bench } from "vitest";

import { test } from "../src/example";

describe("test", () => {
  bench(
    "benchmark test function",
    () => {
      test(9);
    },
    { time: 100 }
  );
});
