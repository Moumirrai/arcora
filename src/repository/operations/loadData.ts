import type { Model } from "@arcora/core/model";
import type { Load } from "@arcora/core/entities/load";
import {
  NodalLoad,
  type NodalLoadData,
  type NodalLoadDataPartial,
} from "@arcora/core/entities/nodalLoad";
import {
  UniformLoad,
  type UniformLoadData,
  type UniformLoadDataPartial,
} from "@arcora/core/entities/uniformLoad";
import {
  TrapezoidalLoad,
  type TrapezoidalLoadData,
  type TrapezoidalLoadDataPartial,
} from "@arcora/core/entities/trapezoidalLoad";
import {
  PointLoadOnSpan,
  type PointLoadOnSpanData,
  type PointLoadOnSpanDataPartial,
} from "@arcora/core/entities/pointLoadOnSpan";
import {
  ThermalLoad,
  type ThermalLoadData,
  type ThermalLoadDataPartial,
} from "@arcora/core/entities/thermalLoad";

export type LoadType =
  | "nodal"
  | "uniform"
  | "trapezoidal"
  | "pointOnSpan"
  | "thermal";

export type LoadData =
  | ({ type: "nodal" } & NodalLoadData)
  | ({ type: "uniform" } & UniformLoadData)
  | ({ type: "trapezoidal" } & TrapezoidalLoadData)
  | ({ type: "pointOnSpan" } & PointLoadOnSpanData)
  | ({ type: "thermal" } & ThermalLoadData);

export type LoadDataPartial =
  | ({ type: "nodal" } & NodalLoadDataPartial)
  | ({ type: "uniform" } & UniformLoadDataPartial)
  | ({ type: "trapezoidal" } & TrapezoidalLoadDataPartial)
  | ({ type: "pointOnSpan" } & PointLoadOnSpanDataPartial)
  | ({ type: "thermal" } & ThermalLoadDataPartial);

export function createLoad(model: Model, data: LoadDataPartial): Load {
  switch (data.type) {
    case "nodal":
      return new NodalLoad(model, data);
    case "uniform":
      return new UniformLoad(model, data);
    case "trapezoidal":
      return new TrapezoidalLoad(model, data);
    case "pointOnSpan":
      return new PointLoadOnSpan(model, data);
    case "thermal":
      return new ThermalLoad(model, data);
  }
}

export function loadTypeOf(load: Load): LoadType {
  if (load instanceof NodalLoad) return "nodal";
  if (load instanceof UniformLoad) return "uniform";
  if (load instanceof TrapezoidalLoad) return "trapezoidal";
  if (load instanceof PointLoadOnSpan) return "pointOnSpan";
  if (load instanceof ThermalLoad) return "thermal";
  throw new Error("Unknown load type");
}

export function loadToData(load: Load): LoadData {
  if (load instanceof NodalLoad) return { type: "nodal", ...load.toData() };
  if (load instanceof UniformLoad) return { type: "uniform", ...load.toData() };
  if (load instanceof TrapezoidalLoad)
    return { type: "trapezoidal", ...load.toData() };
  if (load instanceof PointLoadOnSpan)
    return { type: "pointOnSpan", ...load.toData() };
  if (load instanceof ThermalLoad) return { type: "thermal", ...load.toData() };
  throw new Error("Unknown load type");
}
