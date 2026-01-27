import { Node } from "./entities/node";
import { Element } from "./entities/element";
import { Material } from "./valueProps/material";

export class Model {
  public readonly nodes: Map<string, Node> = new Map();
  public readonly elements: Map<string, Element> = new Map();
  public readonly materials: Map<string, Material> = new Map();

  public addNode() {}
}
