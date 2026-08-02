import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container w-100 position-relative p-3 bg-white rounded-4 shadow-sm border border-light">
      <div *ngIf="title" class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold text-dark mb-0 fs-6">{{ title }}</h6>
        <span *ngIf="subtitle" class="text-muted small">{{ subtitle }}</span>
      </div>

      <!-- Empty chart state -->
      <div *ngIf="!data || data.length === 0" class="py-5 text-center text-muted">
        <p class="mb-0 small">No data available to display</p>
      </div>

      <!-- BAR CHART -->
      <div *ngIf="data && data.length > 0 && type === 'bar'" class="bar-chart d-flex flex-column gap-2 py-2">
        <div *ngFor="let item of data" class="bar-item">
          <div class="d-flex justify-content-between align-items-center mb-1 small">
            <span class="fw-semibold text-slate-700 text-truncate" style="max-width: 60%;">{{ item.label }}</span>
            <span class="fw-bold text-slate-900">{{ item.value }}</span>
          </div>
          <div class="progress rounded-pill" style="height: 10px; background-color: #f1f5f9;">
            <div class="progress-bar rounded-pill transition-all"
                 [style.width.%]="getPercent(item.value)"
                 [style.background-color]="item.color || defaultColor"></div>
          </div>
        </div>
      </div>

      <!-- LINE CHART (SVG Volume Trend) -->
      <div *ngIf="data && data.length > 0 && type === 'line'" class="line-chart py-2">
        <svg viewBox="0 0 500 200" class="w-100" style="overflow: visible;">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Gridlines -->
          <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" stroke-width="1"/>
          <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" stroke-width="1"/>

          <!-- Area & Path -->
          <polygon [attr.points]="getAreaPoints()" fill="url(#lineGrad)"/>
          <polyline [attr.points]="getLinePoints()" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>

          <!-- Data Dots -->
          <circle *ngFor="let pt of getCirclePoints()"
                  [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
        </svg>

        <!-- X Axis Labels -->
        <div class="d-flex justify-content-between text-muted fs-8 mt-2 px-1">
          <span>{{ data[0]?.label }}</span>
          <span>{{ data[data.length - 1]?.label }}</span>
        </div>
      </div>

      <!-- DONUT / PIE CHART -->
      <div *ngIf="data && data.length > 0 && type === 'donut'" class="donut-chart d-flex align-items-center justify-content-around py-3">
        <svg viewBox="0 0 100 100" style="width: 140px; height: 140px; transform: rotate(-90deg);">
          <circle *ngFor="let seg of getDonutSegments()"
                  cx="50" cy="50" r="38"
                  fill="transparent"
                  [attr.stroke]="seg.color"
                  stroke-width="16"
                  [attr.stroke-dasharray]="seg.dashArray"
                  [attr.stroke-dashoffset]="seg.dashOffset" />
        </svg>

        <!-- Legend -->
        <div class="legend d-flex flex-column gap-1.5 ms-3">
          <div *ngFor="let item of data" class="d-flex align-items-center gap-2 fs-7">
            <span class="rounded-circle d-inline-block" [style.background-color]="item.color || defaultColor" style="width:10px; height:10px;"></span>
            <span class="text-muted">{{ item.label }}:</span>
            <span class="fw-bold text-dark">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fs-7 { font-size: 0.8125rem; }
    .fs-8 { font-size: 0.75rem; }
    .transition-all { transition: all 0.5s ease-out; }
    .text-slate-700 { color: #334155; }
    .text-slate-900 { color: #0f172a; }
  `]
})
export class ChartComponent implements OnChanges {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() type: 'bar' | 'line' | 'donut' = 'bar';
  @Input() data: ChartDataPoint[] = [];

  @Input('chartType') set chartTypeAlias(val: 'bar' | 'line' | 'donut') { if (val) this.type = val; }
  @Input('dataPoints') set dataPointsAlias(val: ChartDataPoint[]) { if (val) { this.data = val; this.ngOnChanges(); } }

  defaultColor = '#3b82f6';
  maxValue = 1;
  totalValue = 0;

  ngOnChanges(): void {
    if (this.data && this.data.length > 0) {
      this.maxValue = Math.max(...this.data.map(d => d.value), 1);
      this.totalValue = this.data.reduce((acc, d) => acc + d.value, 0);
    }
  }

  getPercent(val: number): number {
    return Math.round((val / this.maxValue) * 100);
  }

  getLinePoints(): string {
    if (!this.data || this.data.length === 0) return '0,180 500,180';
    const width = 500;
    const height = 150;
    const padding = 20;
    const step = (width - padding * 2) / Math.max(this.data.length - 1, 1);

    return this.data.map((d, i) => {
      const x = padding + i * step;
      const y = height - ((d.value / this.maxValue) * (height - 30));
      return `${x},${y}`;
    }).join(' ');
  }

  getAreaPoints(): string {
    const linePoints = this.getLinePoints();
    return `20,180 ${linePoints} 480,180`;
  }

  getCirclePoints(): { x: number; y: number }[] {
    if (!this.data) return [];
    const width = 500;
    const height = 150;
    const padding = 20;
    const step = (width - padding * 2) / Math.max(this.data.length - 1, 1);

    return this.data.map((d, i) => ({
      x: padding + i * step,
      y: height - ((d.value / this.maxValue) * (height - 30))
    }));
  }

  getDonutSegments(): { color: string; dashArray: string; dashOffset: number }[] {
    if (!this.data || this.totalValue === 0) return [];
    const circumference = 2 * Math.PI * 38; // ~238.76
    let currentOffset = 0;

    return this.data.map(item => {
      const strokeLength = (item.value / this.totalValue) * circumference;
      const segment = {
        color: item.color || this.defaultColor,
        dashArray: `${strokeLength} ${circumference - strokeLength}`,
        dashOffset: -currentOffset
      };
      currentOffset += strokeLength;
      return segment;
    });
  }
}
