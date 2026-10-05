export type RepositoryChangeKind =
  | "node"
  | "element"
  | "material"
  | "crossSection"
  | "loadCase"
  | "load"
  | "boundaryCondition";

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

export function changeKey(kind: RepositoryChangeKind, id: string): string {
  return `${kind}:${id}`;
}

export function recordAdded(
  changes: TransactionChanges,
  kind: RepositoryChangeKind,
  id: string
): void {
  changes.added.set(changeKey(kind, id), { kind, id });
}

export function recordChanged(
  changes: TransactionChanges,
  kind: RepositoryChangeKind,
  id: string
): void {
  changes.changed.set(changeKey(kind, id), { kind, id });
}

export function recordRemoved(
  changes: TransactionChanges,
  kind: RepositoryChangeKind,
  id: string
): void {
  changes.removed.set(changeKey(kind, id), { kind, id });
}
