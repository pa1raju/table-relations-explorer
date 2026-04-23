import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { SchemaService } from '../schema/schema.service';
import {
  RelationEdge,
  SchemaSnapshot,
  TableDefinition,
} from '../schema/schema.model';
import { SchemaDiagramComponent } from '../schema-diagram/schema-diagram.component';

@Component({
  selector: 'app-relations-explorer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    SchemaDiagramComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relations-explorer.component.html',
  styleUrl: './relations-explorer.component.scss',
})
export class RelationsExplorerComponent implements OnInit {
  private readonly schemaService = inject(SchemaService);

  readonly snapshot = signal<SchemaSnapshot | null>(null);
  readonly primaryTable = signal<TableDefinition | null>(null);
  readonly relatedTables = signal<TableDefinition[]>([]);

  readonly primarySuggestions = signal<TableDefinition[]>([]);
  readonly relatedSuggestions = signal<TableDefinition[]>([]);

  readonly allTables = computed<TableDefinition[]>(() => {
    const snap = this.snapshot();
    return snap ? this.schemaService.getTables(snap) : [];
  });

  readonly relatableOptions = computed<TableDefinition[]>(() => {
    const snap = this.snapshot();
    const primary = this.primaryTable();
    if (!snap || !primary) return [];
    const names = new Set(this.schemaService.getRelatedTableNames(snap, primary.name));
    return snap.tables
      .filter((t) => names.has(t.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly edges = computed<RelationEdge[]>(() => {
    const snap = this.snapshot();
    const primary = this.primaryTable();
    if (!snap || !primary) return [];
    return this.schemaService.getEdgesBetween(
      snap,
      primary.name,
      this.relatedTables().map((t) => t.name),
    );
  });

  ngOnInit(): void {
    this.schemaService.loadSchema().subscribe((snap) => this.snapshot.set(snap));
  }

  searchPrimary(event: AutoCompleteCompleteEvent): void {
    const q = (event.query ?? '').toLowerCase();
    this.primarySuggestions.set(
      this.allTables().filter((t) => t.name.toLowerCase().includes(q)),
    );
  }

  searchRelated(event: AutoCompleteCompleteEvent): void {
    const q = (event.query ?? '').toLowerCase();
    const selectedNames = new Set(this.relatedTables().map((t) => t.name));
    this.relatedSuggestions.set(
      this.relatableOptions().filter(
        (t) => !selectedNames.has(t.name) && t.name.toLowerCase().includes(q),
      ),
    );
  }

  onPrimaryChange(): void {
    this.relatedTables.set([]);
  }

  clear(): void {
    this.primaryTable.set(null);
    this.relatedTables.set([]);
  }
}
