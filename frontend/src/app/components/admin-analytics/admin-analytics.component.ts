import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ChartComponent, ChartDataPoint } from '../common/chart.component';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold text-slate-900 mb-1 tracking-tight">Super Admin Executive Governance Analytics</h2>
          <p class="text-muted mb-0">Cross-department grievance tracking, pincode breakdown, and resolution SLAs across the portal.</p>
        </div>
        <button class="btn btn-outline-primary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-1.5" (click)="loadGlobalAnalytics()">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Refresh Analytics</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-5 my-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
        <p class="mt-3 text-muted fw-medium">Aggregating global grievance metrics...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="alert alert-danger rounded-4 p-4 shadow-sm my-4">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-exclamation-octagon-fill fs-2"></i>
          <div>
            <h5 class="fw-bold mb-1">Unable to Load Global Analytics</h5>
            <p class="mb-2 text-danger-emphasis">{{ errorMessage() }}</p>
            <button class="btn btn-sm btn-danger rounded-pill px-3" (click)="loadGlobalAnalytics()">Try Again</button>
          </div>
        </div>
      </div>

      <!-- Analytics Dashboard Content -->
      <div *ngIf="!loading() && !error() && data()" class="row g-4 mb-4">

        <!-- Top KPI Cards Row -->
        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-primary">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Total System Complaints</div>
            <div class="fs-1 fw-bold text-dark mb-0">{{ data()?.totalComplaints || 0 }}</div>
            <div class="text-muted small mt-1">Across all departments</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-success">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Overall Resolution Rate</div>
            <div class="fs-1 fw-bold text-success mb-0">{{ getOverallRate() | number:'1.0-1' }}%</div>
            <div class="text-muted small mt-1">{{ data()?.resolvedCount || 0 }} complaints resolved</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-info">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Global SLA Resolution</div>
            <div class="fs-1 fw-bold text-info mb-0">{{ (data()?.avgResolutionTimeHours || 0) | number:'1.0-1' }}h</div>
            <div class="text-muted small mt-1">Average time to close ticket</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-warning">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Total Active Backlog</div>
            <div class="fs-1 fw-bold text-warning mb-0">{{ (data()?.totalComplaints || 0) - (data()?.resolvedCount || 0) }}</div>
            <div class="text-muted small mt-1">Pending resolution</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="col-lg-6">
          <app-chart
            title="Complaints Distribution by Category"
            chartType="donut"
            [dataPoints]="categoryChartData"
            height="260px">
          </app-chart>
        </div>

        <div class="col-lg-6">
          <app-chart
            title="Global Complaint Volume Trend (30 Days)"
            chartType="line"
            [dataPoints]="volumeChartData"
            height="260px">
          </app-chart>
        </div>

        <!-- Department Performance Comparison Table -->
        <div class="col-12">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white border">
            <div class="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold mb-1 text-dark">Department Performance Comparison</h5>
                <p class="text-muted small mb-0">Cross-department metrics, active workloads, and resolution rates</p>
              </div>
              <span class="badge bg-light text-dark font-monospace border rounded-2 px-3 py-1.5 fs-7">
                {{ data()?.departmentComparison?.length || 0 }} Departments
              </span>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light" style="font-size:0.8rem">
                  <tr>
                    <th class="ps-4">Department Name</th>
                    <th>Total Complaints</th>
                    <th>Resolved</th>
                    <th>Active Backlog</th>
                    <th>Resolution Rate</th>
                    <th class="pe-4">Avg SLA Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let dept of data()?.departmentComparison">
                    <td class="ps-4">
                      <div class="fw-bold text-dark d-flex align-items-center gap-2" style="font-size:0.9rem">
                        <i class="bi bi-building text-primary"></i>
                        <span>{{ dept.departmentName }}</span>
                      </div>
                    </td>
                    <td><span class="fw-bold text-dark">{{ dept.totalComplaints }}</span></td>
                    <td><span class="badge bg-success-subtle text-success px-2.5 py-1.5 rounded-2">{{ dept.resolvedCount }}</span></td>
                    <td><span class="badge bg-warning-subtle text-warning-emphasis px-2.5 py-1.5 rounded-2">{{ dept.totalComplaints - dept.resolvedCount }}</span></td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1 rounded-pill" style="height: 6px; width: 80px;">
                          <div class="progress-bar bg-success rounded-pill" [style.width.%]="getDeptRate(dept)"></div>
                        </div>
                        <span class="fw-bold small">{{ getDeptRate(dept) | number:'1.0-1' }}%</span>
                      </div>
                    </td>
                    <td class="pe-4"><span class="font-monospace fs-7 text-muted">{{ (dept.avgResolutionTimeHours || 0) | number:'1.0-1' }}h</span></td>
                  </tr>
                  <tr *ngIf="!data()?.departmentComparison || data()?.departmentComparison?.length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">No department comparison data available.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Pincode Breakdown Table -->
        <div class="col-12" *ngIf="data()?.pincodeBreakdown?.length">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white border">
            <div class="card-header bg-white p-4 border-bottom">
              <h5 class="fw-bold mb-1 text-dark">Top Pincodes by Grievance Volume</h5>
              <p class="text-muted small mb-0">High density area pincodes requiring targeted municipal focus</p>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light" style="font-size:0.8rem">
                  <tr>
                    <th class="ps-4">Pincode</th>
                    <th class="pe-4">Total Grievance Complaints</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pin of data()?.pincodeBreakdown">
                    <td class="ps-4">
                      <span class="font-monospace fw-bold text-dark fs-7 d-inline-flex align-items-center gap-1.5">
                        <i class="bi bi-geo-alt-fill text-danger opacity-75"></i> {{ pin.pincode }}
                      </span>
                    </td>
                    <td class="pe-4"><span class="fw-bold text-primary">{{ pin.count }} complaints</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .text-slate-900 { color: #0f172a; }
    .fs-7 { font-size: 0.8125rem; }
  `]
})
export class AdminAnalyticsComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  errorMessage = signal<string>('');
  data = signal<any>(null);

  categoryChartData: ChartDataPoint[] = [];
  volumeChartData: ChartDataPoint[] = [];

  ngOnInit(): void {
    this.loadGlobalAnalytics();
  }

  loadGlobalAnalytics(): void {
    this.loading.set(true);
    this.error.set(false);

    this.apiService.getGlobalAnalytics().subscribe({
      next: (res) => {
        this.data.set(res);
        this.prepareChartData(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(true);
        this.errorMessage.set(err.error?.message || 'Failed to fetch global analytics.');
        this.loading.set(false);
      }
    });
  }

  getOverallRate(): number {
    const d = this.data();
    if (!d || !d.totalComplaints || d.totalComplaints === 0) return 0;
    return (d.resolvedCount * 100.0) / d.totalComplaints;
  }

  getDeptRate(dept: any): number {
    if (!dept || !dept.totalComplaints || dept.totalComplaints === 0) return 0;
    return (dept.resolvedCount * 100.0) / dept.totalComplaints;
  }

  private prepareChartData(res: any): void {
    const categoryColors: { [key: string]: string } = {
      WATER: '#0284c7',
      ROADS: '#d97706',
      ELECTRICITY: '#eab308',
      SANITATION: '#059669',
      PUBLIC_HEALTH: '#dc2626',
      OTHER: '#64748b'
    };

    if (res.categoryBreakdown) {
      this.categoryChartData = res.categoryBreakdown.map((c: any) => ({
        label: c.category,
        value: c.count,
        color: categoryColors[c.category] || '#3b82f6'
      }));
    }

    if (res.volumeTrend) {
      this.volumeChartData = res.volumeTrend.map((v: any) => ({
        label: v.date,
        value: v.count
      }));
    }
  }
}
