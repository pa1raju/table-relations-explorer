import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  viewChild,
} from '@angular/core';
import * as d3 from 'd3';

import {
  RelationEdge,
  TableColumn,
  TableDefinition,
} from '../schema/schema.model';

interface DiagramNode {
  name: string;
  columns: TableColumn[];
  x: number;
  y: number;
  isPrimary: boolean;
}

const TABLE_WIDTH = 220;
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 24;
const PRIMARY_FILL = '#3b82f6';
const RELATED_FILL = '#10b981';
const LINK_DEFAULT_STROKE = '#94a3b8';
const LINK_HIGHLIGHT_STROKE = '#f59e0b';
const LINK_DEFAULT_WIDTH = 1.6;
const LINK_HIGHLIGHT_WIDTH = 2.4;
const LABEL_DEFAULT_BORDER = '#cbd5e1';
const LABEL_DEFAULT_TEXT = '#334155';

function linkKey(d: RelationEdge): string {
  return `${d.fromTable}.${d.fromColumn}->${d.toTable}.${d.toColumn}`;
}

@Component({
  selector: 'app-schema-diagram',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="diagram-host">
      <div class="toolbar">
        <button type="button" (click)="resetView()" title="Fit to content">Reset view</button>
        <span class="hint">Drag tables to reposition · scroll to zoom · drag empty space to pan</span>
      </div>
      <svg #svg class="diagram"></svg>
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; }
      .diagram-host { width: 100%; height: 100%; display: flex; flex-direction: column; }
      .toolbar {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.4rem 0.5rem; border-bottom: 1px solid #e2e8f0;
      }
      .toolbar button {
        background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px;
        padding: 0.25rem 0.6rem; font-size: 0.8rem; cursor: pointer;
      }
      .toolbar button:hover { background: #e2e8f0; }
      .hint { color: #64748b; font-size: 0.75rem; }
      svg.diagram {
        flex: 1; width: 100%; height: 100%; background: #f8fafc;
        cursor: grab;
      }
      svg.diagram:active { cursor: grabbing; }
    `,
  ],
})
export class SchemaDiagramComponent {
  readonly primary = input<TableDefinition | null>(null);
  readonly related = input<TableDefinition[]>([]);
  readonly edges = input<RelationEdge[]>([]);

  private readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  private readonly nodes = new Map<string, DiagramNode>();
  private zoomBehavior?: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private lastPrimaryName: string | null = null;

  constructor() {
    effect(() => {
      const primary = this.primary();
      const related = this.related();
      const edges = this.edges();
      const svgEl = this.svgRef().nativeElement;
      queueMicrotask(() => this.rebuild(svgEl, primary, related, edges));
    });
  }

  resetView(): void {
    const svgEl = this.svgRef().nativeElement;
    if (this.zoomBehavior) {
      const nodes = [...this.nodes.values()];
      if (nodes.length === 0) return;
      const t = this.computeFitTransform(svgEl, nodes);
      d3.select(svgEl)
        .transition()
        .duration(250)
        .call(this.zoomBehavior.transform as any, t);
    }
  }

  private nodeHeight(n: DiagramNode): number {
    return HEADER_HEIGHT + n.columns.length * ROW_HEIGHT;
  }

  private columnCenterY(n: DiagramNode, col: string): number {
    const idx = n.columns.findIndex((c) => c.name === col);
    const safeIdx = idx < 0 ? 0 : idx;
    return n.y + HEADER_HEIGHT + safeIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
  }

  private linkGeometry(
    src: DiagramNode,
    tgt: DiagramNode,
    srcCol: string,
    tgtCol: string,
  ): { d: string; midX: number; midY: number } {
    const srcLeft = src.x;
    const srcRight = src.x + TABLE_WIDTH;
    const tgtLeft = tgt.x;
    const tgtRight = tgt.x + TABLE_WIDTH;

    const y1 = this.columnCenterY(src, srcCol);
    const y2 = this.columnCenterY(tgt, tgtCol);

    const horizOverlap = srcLeft < tgtRight && tgtLeft < srcRight;

    let srcFromRight: boolean;
    let tgtToRight: boolean;

    if (horizOverlap) {
      const srcCenter = src.x + TABLE_WIDTH / 2;
      const tgtCenter = tgt.x + TABLE_WIDTH / 2;
      const leaningLeft = srcCenter + tgtCenter >= 2 * Math.min(srcLeft, tgtLeft) + TABLE_WIDTH;
      srcFromRight = !leaningLeft;
      tgtToRight = !leaningLeft;
    } else {
      const srcIsLeftOfTgt = srcRight <= tgtLeft;
      srcFromRight = srcIsLeftOfTgt;
      tgtToRight = !srcIsLeftOfTgt;
    }

    const x1 = srcFromRight ? srcRight : srcLeft;
    const x2 = tgtToRight ? tgtRight : tgtLeft;

    const horizDist = Math.abs(x2 - x1);
    const vertDist = Math.abs(y2 - y1);
    const reach = Math.max(80, horizOverlap ? vertDist * 0.6 : horizDist * 0.45);

    const c1x = srcFromRight ? x1 + reach : x1 - reach;
    const c2x = tgtToRight ? x2 + reach : x2 - reach;

    const d = `M${x1},${y1} C${c1x},${y1} ${c2x},${y2} ${x2},${y2}`;
    const midX = 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
    const midY = 0.5 * (y1 + y2);
    return { d, midX, midY };
  }

  private reconcileNodes(
    primary: TableDefinition | null,
    related: TableDefinition[],
  ): { nodes: DiagramNode[]; hasNew: boolean } {
    const wanted = new Set<string>();
    if (primary) wanted.add(primary.name);
    related.forEach((t) => wanted.add(t.name));

    for (const key of [...this.nodes.keys()]) {
      if (!wanted.has(key)) this.nodes.delete(key);
    }

    let hasNew = false;

    if (primary) {
      if (!this.nodes.has(primary.name)) {
        this.nodes.set(primary.name, {
          name: primary.name,
          columns: primary.columns,
          x: 0,
          y: 0,
          isPrimary: true,
        });
        hasNew = true;
      } else {
        const existing = this.nodes.get(primary.name)!;
        existing.columns = primary.columns;
        existing.isPrimary = true;
      }
    }

    for (const t of related) {
      if (!this.nodes.has(t.name)) {
        this.nodes.set(t.name, {
          name: t.name,
          columns: t.columns,
          x: 0,
          y: 0,
          isPrimary: false,
        });
        hasNew = true;
      } else {
        const existing = this.nodes.get(t.name)!;
        existing.columns = t.columns;
        existing.isPrimary = false;
      }
    }

    this.placeUnplacedNodes(primary);
    return { nodes: [...this.nodes.values()], hasNew };
  }

  private placeUnplacedNodes(primary: TableDefinition | null): void {
    if (!primary) return;
    const primaryNode = this.nodes.get(primary.name);
    if (!primaryNode) return;

    const unplaced = [...this.nodes.values()].filter(
      (n) => n !== primaryNode && n.x === 0 && n.y === 0,
    );
    if (unplaced.length === 0) return;

    const radius = 420;
    unplaced.forEach((node, i) => {
      const angle = (i / unplaced.length) * 2 * Math.PI - Math.PI / 2;
      node.x = primaryNode.x + Math.cos(angle) * radius;
      node.y = primaryNode.y + Math.sin(angle) * radius;
    });
  }

  private rebuild(
    svgEl: SVGSVGElement,
    primary: TableDefinition | null,
    related: TableDefinition[],
    edges: RelationEdge[],
  ): void {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const { nodes, hasNew } = this.reconcileNodes(primary, related);
    if (nodes.length === 0) {
      this.lastPrimaryName = primary?.name ?? null;
      return;
    }

    const primaryChanged = (primary?.name ?? null) !== this.lastPrimaryName;
    this.lastPrimaryName = primary?.name ?? null;

    const defs = svg.append('defs');
    this.appendArrowMarker(defs, 'arrow', LINK_DEFAULT_STROKE);
    this.appendArrowMarker(defs, 'arrow-hover', LINK_HIGHLIGHT_STROKE);

    const rootG = svg.append('g').attr('class', 'viewport');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        rootG.attr('transform', event.transform.toString());
      });
    this.zoomBehavior = zoom;
    svg.call(zoom as any);

    const linksGroup = rootG.append('g').attr('class', 'links');
    const nodesGroup = rootG.append('g').attr('class', 'nodes');

    const self = this;

    const redrawLinks = () => {
      linksGroup
        .selectAll<SVGGElement, RelationEdge>('g.link')
        .each(function (d) {
          const src = self.nodes.get(d.fromTable);
          const tgt = self.nodes.get(d.toTable);
          if (!src || !tgt) return;
          const { d: path, midX, midY } = self.linkGeometry(src, tgt, d.fromColumn, d.toColumn);
          const g = d3.select(this);
          g.select('path.hit').attr('d', path);
          g.select('path.vis').attr('d', path);
          g.select('g.label').attr('transform', `translate(${midX},${midY})`);
        });
    };

    const highlightLink = (groupEl: SVGGElement) => {
      const g = d3.select(groupEl);
      g.select<SVGPathElement>('path.vis')
        .attr('stroke', LINK_HIGHLIGHT_STROKE)
        .attr('stroke-width', LINK_HIGHLIGHT_WIDTH)
        .attr('marker-end', 'url(#arrow-hover)');
      g.select<SVGRectElement>('rect.label-bg').attr('stroke', LINK_HIGHLIGHT_STROKE);
      g.select<SVGTextElement>('text.label-text').attr('fill', LINK_HIGHLIGHT_STROKE);
      g.raise();
    };

    const unhighlightLink = (groupEl: SVGGElement) => {
      const g = d3.select(groupEl);
      g.select<SVGPathElement>('path.vis')
        .attr('stroke', LINK_DEFAULT_STROKE)
        .attr('stroke-width', LINK_DEFAULT_WIDTH)
        .attr('marker-end', 'url(#arrow)');
      g.select<SVGRectElement>('rect.label-bg').attr('stroke', LABEL_DEFAULT_BORDER);
      g.select<SVGTextElement>('text.label-text').attr('fill', LABEL_DEFAULT_TEXT);
    };

    const linkGroups = linksGroup
      .selectAll<SVGGElement, RelationEdge>('g.link')
      .data(edges, (d: any) => linkKey(d))
      .enter()
      .append('g')
      .attr('class', 'link');

    linkGroups
      .append('path')
      .attr('class', 'hit')
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 14)
      .style('cursor', 'pointer')
      .style('pointer-events', 'stroke');

    linkGroups
      .append('path')
      .attr('class', 'vis')
      .attr('fill', 'none')
      .attr('stroke', LINK_DEFAULT_STROKE)
      .attr('stroke-width', LINK_DEFAULT_WIDTH)
      .attr('marker-end', 'url(#arrow)')
      .style('pointer-events', 'none')
      .style('transition', 'stroke 120ms ease, stroke-width 120ms ease');

    linkGroups
      .append('title')
      .text((d) => `${d.fromTable}.${d.fromColumn}  →  ${d.toTable}.${d.toColumn}`);

    linkGroups.each(function (d) {
      const labelG = d3
        .select(this)
        .append('g')
        .attr('class', 'label')
        .style('pointer-events', 'none');

      const labelText = `${d.fromColumn} → ${d.toColumn}`;
      const text = labelG
        .append('text')
        .attr('class', 'label-text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', 10)
        .attr('font-weight', 500)
        .attr('fill', LABEL_DEFAULT_TEXT)
        .text(labelText);

      const bbox = (text.node() as SVGTextElement).getBBox();
      const padX = 6;
      const padY = 3;
      labelG
        .insert('rect', 'text')
        .attr('class', 'label-bg')
        .attr('x', bbox.x - padX)
        .attr('y', bbox.y - padY)
        .attr('width', bbox.width + padX * 2)
        .attr('height', bbox.height + padY * 2)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', '#ffffff')
        .attr('stroke', LABEL_DEFAULT_BORDER)
        .attr('stroke-width', 1);
    });

    linkGroups
      .on('mouseenter', function () {
        highlightLink(this as SVGGElement);
      })
      .on('mouseleave', function () {
        unhighlightLink(this as SVGGElement);
      });

    const drag = d3
      .drag<SVGGElement, DiagramNode>()
      .on('start', function () {
        d3.select(this).raise();
      })
      .on('drag', function (event, d) {
        d.x += event.dx;
        d.y += event.dy;
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
        redrawLinks();
      });

    const nodeSel = nodesGroup
      .selectAll<SVGGElement, DiagramNode>('g.table-node')
      .data(nodes, (d: any) => d.name)
      .enter()
      .append('g')
      .attr('class', 'table-node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'move')
      .call(drag as any);

    nodeSel
      .on('mouseenter', function (_event, d) {
        linksGroup
          .selectAll<SVGGElement, RelationEdge>('g.link')
          .filter((l) => l.fromTable === d.name || l.toTable === d.name)
          .each(function () {
            highlightLink(this as SVGGElement);
          });
      })
      .on('mouseleave', function (_event, d) {
        linksGroup
          .selectAll<SVGGElement, RelationEdge>('g.link')
          .filter((l) => l.fromTable === d.name || l.toTable === d.name)
          .each(function () {
            unhighlightLink(this as SVGGElement);
          });
      });

    nodeSel
      .append('rect')
      .attr('class', 'table-body')
      .attr('width', TABLE_WIDTH)
      .attr('height', (d) => this.nodeHeight(d))
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', '#ffffff')
      .attr('stroke', (d) => (d.isPrimary ? '#1d4ed8' : '#047857'))
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.08))');

    nodeSel
      .append('rect')
      .attr('class', 'table-header')
      .attr('width', TABLE_WIDTH)
      .attr('height', HEADER_HEIGHT)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => (d.isPrimary ? PRIMARY_FILL : RELATED_FILL));

    nodeSel
      .append('rect')
      .attr('x', 0)
      .attr('y', HEADER_HEIGHT - 8)
      .attr('width', TABLE_WIDTH)
      .attr('height', 8)
      .attr('fill', (d) => (d.isPrimary ? PRIMARY_FILL : RELATED_FILL));

    nodeSel
      .append('text')
      .attr('x', TABLE_WIDTH / 2)
      .attr('y', HEADER_HEIGHT / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-weight', 600)
      .attr('font-size', 13)
      .attr('pointer-events', 'none')
      .text((d) => d.name);

    nodeSel.each(function (d) {
      const g = d3.select<SVGGElement, DiagramNode>(this as SVGGElement);
      d.columns.forEach((col, i) => {
        const yTop = HEADER_HEIGHT + i * ROW_HEIGHT;
        const row = g.append('g').attr('class', 'column-row');

        row
          .append('rect')
          .attr('x', 1)
          .attr('y', yTop)
          .attr('width', TABLE_WIDTH - 2)
          .attr('height', ROW_HEIGHT)
          .attr('fill', i % 2 === 0 ? '#f8fafc' : '#ffffff');

        if (col.primaryKey) {
          row
            .append('text')
            .attr('x', 10)
            .attr('y', yTop + ROW_HEIGHT / 2)
            .attr('dominant-baseline', 'central')
            .attr('font-size', 10)
            .attr('font-weight', 700)
            .attr('fill', '#b45309')
            .attr('pointer-events', 'none')
            .text('PK');
        }

        row
          .append('text')
          .attr('x', col.primaryKey ? 34 : 10)
          .attr('y', yTop + ROW_HEIGHT / 2)
          .attr('dominant-baseline', 'central')
          .attr('font-size', 12)
          .attr('fill', '#0f172a')
          .attr('pointer-events', 'none')
          .text(col.name);

        row
          .append('text')
          .attr('x', TABLE_WIDTH - 10)
          .attr('y', yTop + ROW_HEIGHT / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .attr('font-size', 11)
          .attr('fill', '#64748b')
          .attr('pointer-events', 'none')
          .text(col.type);
      });

      g.append('rect')
        .attr('class', 'border-overlay')
        .attr('width', TABLE_WIDTH)
        .attr('height', HEADER_HEIGHT + d.columns.length * ROW_HEIGHT)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', 'none')
        .attr('stroke', d.isPrimary ? '#1d4ed8' : '#047857')
        .attr('stroke-width', 2)
        .attr('pointer-events', 'none');
    });

    redrawLinks();

    if (hasNew || primaryChanged) {
      const t = this.computeFitTransform(svgEl, nodes);
      d3.select(svgEl).call(zoom.transform as any, t);
    }
  }

  private appendArrowMarker(
    defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
    id: string,
    color: string,
  ): void {
    defs
      .append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', color);
  }

  private computeFitTransform(svgEl: SVGSVGElement, nodes: DiagramNode[]): d3.ZoomTransform {
    const padding = 40;
    const minX = Math.min(...nodes.map((n) => n.x)) - padding;
    const minY = Math.min(...nodes.map((n) => n.y)) - padding;
    const maxX = Math.max(...nodes.map((n) => n.x + TABLE_WIDTH)) + padding;
    const maxY = Math.max(...nodes.map((n) => n.y + this.nodeHeight(n))) + padding;

    const width = maxX - minX;
    const height = maxY - minY;

    const rect = svgEl.getBoundingClientRect();
    const svgWidth = rect.width || 800;
    const svgHeight = rect.height || 500;

    const scale = Math.min(svgWidth / width, svgHeight / height, 1);
    const translateX = (svgWidth - width * scale) / 2 - minX * scale;
    const translateY = (svgHeight - height * scale) / 2 - minY * scale;

    return d3.zoomIdentity.translate(translateX, translateY).scale(scale);
  }
}
