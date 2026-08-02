import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, ComplaintDto } from '../../services/api.service';
import { ChartComponent, ChartDataPoint } from '../common/chart.component';

@Component({
  selector: 'app-dept-head-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChartComponent],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold text-slate-900 mb-1 tracking-tight">Department Management Dashboard</h2>
          <p class="text-muted mb-0">Track grievance metrics, assign field officers, and provision department staff accounts.</p>
        </div>
        <button class="btn btn-outline-primary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-1.5" (click)="loadAnalytics()">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Refresh Dashboard</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-5 my-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
        <p class="mt-3 text-muted fw-medium">Fetching department analytics and grievances...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="alert alert-danger rounded-4 p-4 shadow-sm my-4">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-exclamation-octagon-fill fs-2"></i>
          <div>
            <h5 class="fw-bold mb-1">Unable to Load Analytics</h5>
            <p class="mb-2 text-danger-emphasis">{{ errorMessage() }}</p>
            <button class="btn btn-sm btn-danger rounded-pill px-3" (click)="loadAnalytics()">Try Again</button>
          </div>
        </div>
      </div>

      <!-- Analytics Dashboard Content -->
      <div *ngIf="!loading() && !error() && data()" class="row g-4 mb-4">

        <!-- Top KPI Cards Row -->
        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-primary">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Total Complaints</div>
            <div class="fs-1 fw-bold text-dark mb-0">{{ data()?.totalComplaints || 0 }}</div>
            <div class="text-muted small mt-1">Logged in department</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-success">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Resolved Rate</div>
            <div class="fs-1 fw-bold text-success mb-0">{{ (data()?.resolutionRatePercentage || 0) | number:'1.0-1' }}%</div>
            <div class="text-muted small mt-1">{{ data()?.resolvedComplaints || 0 }} complaints fixed</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-info">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Avg Resolution Time</div>
            <div class="fs-1 fw-bold text-info mb-0">{{ (data()?.averageResolutionTimeHours || 0) | number:'1.0-1' }}h</div>
            <div class="text-muted small mt-1">From filing to resolution</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border border-start border-4 border-warning">
            <div class="text-muted small font-weight-bold text-uppercase mb-1">Active Backlog</div>
            <div class="fs-1 fw-bold text-warning mb-0">{{ data()?.activeBacklog || 0 }}</div>
            <div class="text-muted small mt-1">Assigned or In Progress</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="col-lg-6">
          <app-chart
            title="Grievance Status Breakdown"
            chartType="donut"
            [dataPoints]="statusChartData"
            height="260px">
          </app-chart>
        </div>

        <div class="col-lg-6">
          <app-chart
            title="Complaint Volume Trend (30 Days)"
            chartType="line"
            [dataPoints]="volumeChartData"
            height="260px">
          </app-chart>
        </div>

        <!-- Complaints Table -->
        <div class="col-12">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white border">
            <div class="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold mb-1 text-dark">Department Grievance Queue</h5>
                <p class="text-muted small mb-0">Select any grievance to assign a field officer or monitor status</p>
              </div>
              <span class="badge bg-slate-100 text-slate-700 font-monospace border rounded-2 px-3 py-1.5 fs-7">
                {{ departmentComplaints().length }} Items
              </span>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light" style="font-size:0.8rem">
                  <tr>
                    <th class="ps-4">Title</th>
                    <th>Status</th>
                    <th>Pincode</th>
                    <th>Assigned Officer</th>
                    <th>Upvotes</th>
                    <th class="pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of departmentComplaints()">
                    <td class="ps-4">
                      <div class="fw-bold text-dark" style="font-size:0.9rem">{{ item.title }}</div>
                      <div class="text-muted small">{{ item.category }} • {{ item.createdAt | date:'shortDate' }}</div>
                    </td>
                    <td>
                      <span class="badge badge-status" [ngClass]="getStatusBadgeClass(item.status)">
                        {{ item.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td><span class="font-monospace fs-7 text-dark">{{ item.pincode }}</span></td>
                    <td>
                      <span *ngIf="item.assignedOfficerName" class="badge bg-info-subtle text-info-emphasis px-2.5 py-1.5 rounded-2 d-inline-flex align-items-center gap-1">
                        <i class="bi bi-person-badge"></i> {{ item.assignedOfficerName }}
                      </span>
                      <span *ngIf="!item.assignedOfficerName" class="badge bg-warning-subtle text-warning-emphasis px-2.5 py-1.5 rounded-2 d-inline-flex align-items-center gap-1">
                        <i class="bi bi-exclamation-triangle"></i> Unassigned
                      </span>
                    </td>
                    <td>
                      <span class="fw-bold text-primary d-inline-flex align-items-center gap-1">
                        <i class="bi bi-hand-thumbs-up-fill"></i> {{ item.upvoteCount }}
                      </span>
                    </td>
                    <td class="pe-4 text-end">
                      <a [routerLink]="['/complaints', item.id]" class="btn btn-sm btn-primary rounded-pill px-3 font-weight-bold d-inline-flex align-items-center gap-1">
                        <span>Assign / Manage</span>
                        <i class="bi bi-arrow-right-short"></i>
                      </a>
                    </td>
                  </tr>
                  <tr *ngIf="departmentComplaints().length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">No complaints found for this department.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Add Field Officer Panel -->
        <div class="col-12">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border">
            <div class="card-header bg-primary text-white p-3.5 d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-person-plus-fill"></i>
                <span>Add New Department Field Officer</span>
              </h6>
              <small class="opacity-75">Creates a field officer account assigned to your department</small>
            </div>
            <div class="card-body p-4">
              <form (ngSubmit)="createOfficer()">
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label small fw-bold text-muted text-uppercase">Officer Full Name</label>
                    <input type="text" class="form-control rounded-3" [(ngModel)]="officerForm.name" name="officerName" placeholder="e.g. Field Officer 2" required />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-bold text-muted text-uppercase">Officer Email</label>
                    <input type="email" class="form-control rounded-3" [(ngModel)]="officerForm.email" name="officerEmail" placeholder="e.g. officer2@portal.gov" required />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label small fw-bold text-muted text-uppercase">Initial Password</label>
                    <input type="text" class="form-control rounded-3" [(ngModel)]="officerForm.password" name="officerPassword" placeholder="Minimum 6 chars" required />
                  </div>
                  <div class="col-md-2 d-flex align-items-end">
                    <button type="submit" class="btn btn-primary w-100 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-1" [disabled]="creatingOfficer()">
                      <span *ngIf="creatingOfficer()" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="!creatingOfficer()" class="bi bi-person-plus"></i>
                      <span>Add Officer</span>
                    </button>
                  </div>
                </div>
                <div *ngIf="officerSuccess" class="alert alert-success mt-3 py-2 px-3 small rounded-3 mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ officerSuccess }}</span>
                </div>
                <div *ngIf="officerError" class="alert alert-danger mt-3 py-2 px-3 small rounded-3 mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <span>{{ officerError }}</span>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .text-slate-900 { color: #0f172a; }
    .bg-slate-100 { background-color: #f1f5f9; }
    .text-slate-700 { color: #334155; }
    .fs-7 { font-size: 0.8125rem; }
  `]
})
export class DeptHeadDashboardComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = signal<boolean>(true);
  error = signal<boolean>(false);
  errorMessage = signal<string>('');
  data = signal<any>(null);
  departmentComplaints = signal<ComplaintDto[]>([]);

  statusChartData: ChartDataPoint[] = [];
  volumeChartData: ChartDataPoint[] = [];

  officerForm = { name: '', email: '', password: 'password123' };
  creatingOfficer = signal<boolean>(false);
  officerSuccess = '';
  officerError = '';

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    const user = this.apiService.getCurrentUser();
    if (!user || !user.departmentId) {
      this.error.set(true);
      this.errorMessage.set('No department associated with current user session.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.apiService.getDepartmentAnalytics(user.departmentId).subscribe({
      next: (res) => {
        this.data.set(res);
        this.prepareChartData(res);
      },
      error: (err) => {
        this.error.set(true);
        this.errorMessage.set(err.error?.message || 'Failed to fetch department analytics.');
      }
    });

    this.apiService.getDepartmentComplaints().subscribe({
      next: (complaints) => {
        this.departmentComplaints.set(complaints || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  createOfficer(): void {
    if (!this.officerForm.name || !this.officerForm.email || !this.officerForm.password) return;
    this.creatingOfficer.set(true);
    this.officerSuccess = '';
    this.officerError = '';

    this.apiService.createOfficer(this.officerForm).subscribe({
      next: (res) => {
        this.creatingOfficer.set(false);
        this.officerSuccess = `Officer created successfully: ${res.name} (${res.email})`;
        this.officerForm = { name: '', email: '', password: 'password123' };
      },
      error: (err) => {
        this.creatingOfficer.set(false);
        this.officerError = err.error?.message || 'Failed to create officer.';
      }
    });
  }

  private prepareChartData(res: any): void {
    const statusColors: { [key: string]: string } = {
      FILED: '#64748b',
      ASSIGNED: '#0284c7',
      IN_PROGRESS: '#d97706',
      RESOLVED: '#059669',
      REOPENED: '#ea580c',
      CLOSED: '#334155'
    };

    if (res.statusBreakdown) {
      this.statusChartData = res.statusBreakdown.map((s: any) => ({
        label: s.status.replace('_', ' '),
        value: s.count,
        color: statusColors[s.status] || '#3b82f6'
      }));
    }

    if (res.volumeTrend) {
      this.volumeChartData = res.volumeTrend.map((v: any) => ({
        label: v.date,
        value: v.count
      }));
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'FILED': return 'badge-filed';
      case 'ASSIGNED': return 'badge-assigned';
      case 'IN_PROGRESS': return 'badge-in_progress';
      case 'RESOLVED': return 'badge-resolved';
      case 'CLOSED': return 'badge-closed';
      case 'REOPENED': return 'badge-reopened';
      default: return 'bg-secondary';
    }
  }
}
