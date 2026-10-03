import type { NodalLoad } from "./nodalLoad";
import type { ElementLoad } from "./elementLoad";

export type Load = NodalLoad | ElementLoad;
