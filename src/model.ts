import { Node } from "./node";
import { Element } from "./element";
import { Material } from "./material";

export class Model {
  public nodes: Node[] = [];
  public elements: Element[] = [];
  public materials: Material[] = [];
}
