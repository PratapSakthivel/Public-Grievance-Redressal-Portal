import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, ComplaintDto } from '../../services/api.service';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Executive Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold mb-1 tracking-tight" style="color:#0f172a">My Filed Grievances</h2>
          <p class="text-muted mb-0">Track live resolution updates, officer assignments, and audit trails for your submitted issues.</p>
        </div>
        <div class="d-flex gap-2">
          <a routerLink="/file-complaint" class="btn btn-primary rounded-3 px-4 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5">
            <i class="bi bi-plus-circle-fill"></i>
            <span>File New Grievance</span>
          </a>
          <button class="btn btn-outline-secondary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-1" (click)="load()">
            <i class="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem;"></div>
        <p class="mt-2 text-muted small fw-medium">Loading your grievance tracking console...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && complaints().length === 0"
           class="text-center py-5 bg-white rounded-4 border shadow-sm">
        <i class="bi bi-journal-x fs-1 text-slate-300 d-block mb-2"></i>
        <h5 class="fw-bold text-dark">No Grievances Filed Yet</h5>
        <p class="text-muted small">You haven't filed any public grievances under this account.</p>
        <a routerLink="/file-complaint" class="btn btn-primary rounded-3 px-4 mt-2 font-weight-bold d-inline-flex align-items-center gap-1.5">
          <i class="bi bi-plus-circle-fill"></i>
          <span>File Your First Grievance</span>
        </a>
      </div>

      <!-- Complaint Cards -->
      <div *ngIf="!loading() && complaints().length > 0" class="row g-4">
        <div *ngFor="let c of complaints()" class="col-md-6">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white border hover-card transition-all">
            <div class="card-header bg-white px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
              <span class="badge badge-status" [ngClass]="getStatusClass(c.status)">
                {{ c.status.replace('_', ' ') }}
              </span>
              <span class="text-muted small font-monospace">{{ c.createdAt | date:'mediumDate' }}</span>
            </div>

            <div class="card-body px-4 py-3.5 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="fw-bold mb-0 text-dark tracking-tight fs-6">{{ c.title }}</h6>
                  <span class="badge bg-slate-100 text-slate-700 border ms-2 small fw-normal">{{ c.category }}</span>
                </div>

                <p class="text-muted small mb-3 text-truncate-2">
                  {{ c.description }}
                </p>

                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <div class="p-2.5 bg-light rounded-3 border small">
                      <div class="text-muted small text-uppercase fw-bold" style="font-size:0.68rem">Department</div>
                      <div class="fw-semibold text-dark text-truncate d-flex align-items-center gap-1">
                        <i class="bi bi-building text-muted"></i>
                        <span>{{ c.departmentName || 'Unassigned' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 bg-light rounded-3 border small">
                      <div class="text-muted small text-uppercase fw-bold" style="font-size:0.68rem">Assigned Officer</div>
                      <div class="fw-semibold text-dark text-truncate d-flex align-items-center gap-1">
                        <i class="bi bi-person-badge text-muted"></i>
                        <span>{{ c.assignedOfficerName || 'Pending' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 bg-light rounded-3 border small">
                      <div class="text-muted small text-uppercase fw-bold" style="font-size:0.68rem">Location</div>
                      <div class="fw-semibold text-dark text-truncate d-flex align-items-center gap-1">
                        <i class="bi bi-geo-alt-fill text-danger opacity-75"></i>
                        <span>{{ c.areaName || c.pincode }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2.5 bg-light rounded-3 border small">
                      <div class="text-muted small text-uppercase fw-bold" style="font-size:0.68rem">Upvotes</div>
                      <div class="fw-bold text-primary d-flex align-items-center gap-1">
                        <i class="bi bi-hand-thumbs-up-fill"></i>
                        <span>{{ c.upvoteCount }} Community Upvotes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between small text-muted mb-1 font-weight-medium">
                    <span>Resolution Stages</span>
                    <span>{{ getProgressPercent(c.status) }}%</span>
                  </div>
                  <div class="progress rounded-pill" style="height:6px">
                    <div class="progress-bar rounded-pill"
                         [ngClass]="getProgressClass(c.status)"
                         [style.width]="getProgressPercent(c.status) + '%'">
                    </div>
                  </div>
                </div>
              </div>

              <a [routerLink]="['/complaints', c.id]"
                 class="btn btn-outline-primary btn-sm rounded-3 px-3 w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1">
                <span>View Full Audit Trail & History</span>
                <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-truncate-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .bg-slate-100 { background-color: #f1f5f9; }
    .text-slate-700 { color: #334155; }
    .hover-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.06) !important;
    }
  `]
})
export class CitizenDashboardComponent implements OnInit {
  private api = inject(ApiService);

  complaints = signal<ComplaintDto[]>([]);
  loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getMyComplaints().subscribe({
      next: (data) => { this.complaints.set(data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getStatusClass(status: string): string {
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

  getProgressPercent(status: string): number {
    const map: Record<string,number> = {
      FILED: 15, ASSIGNED: 35, IN_PROGRESS: 65,
      RESOLVED: 90, CLOSED: 100, REOPENED: 45
    };
    return map[status] || 0;
  }

  getProgressClass(status: string): string {
    const map: Record<string,string> = {
      FILED: 'bg-secondary', ASSIGNED: 'bg-primary',
      IN_PROGRESS: 'bg-warning', RESOLVED: 'bg-success',
      CLOSED: 'bg-dark', REOPENED: 'bg-danger'
    };
    return map[status] || 'bg-primary';
  }
}
