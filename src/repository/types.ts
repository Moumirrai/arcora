export type RepositoryChange = {
  kind: "node" | "element";
  id: string;
};

export type TransactionChanges = {
  added: Map<string, RepositoryChange>;
  changed: Map<string, RepositoryChange>;
  removed: Map<string, RepositoryChange>;
};
