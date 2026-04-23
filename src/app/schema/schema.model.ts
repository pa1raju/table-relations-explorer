export interface TableColumn {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
}

export interface TableDefinition {
  name: string;
  columns: TableColumn[];
}

export interface ForeignKey {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface SchemaSnapshot {
  tables: TableDefinition[];
  foreignKeys: ForeignKey[];
}

export interface RelationEdge {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  direction: 'outgoing' | 'incoming';
}