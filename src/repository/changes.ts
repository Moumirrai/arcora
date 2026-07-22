export type RepositoryChangeKind =
  | "node"
  | "element"
  | "material"
  | "crossSection"
  | "loadCase"
  | "load";

export type RepositoryChange = {
  kind: RepositoryChangeKind;
  id: string;
};

export type TransactionChanges = {
  added: Map<string, RepositoryChange>;
  changed: Map<string, RepositoryChange>;
  removed: Map<string, RepositoryChange>;
};

export function createTransactionChanges(): TransactionChanges {
  return {
    added: new Map(),
    changed: new Map(),
    removed: new Map(),
  };
}
