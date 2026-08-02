import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, ComplaintDto } from '../../services/api.service';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold mb-1 tracking-tight" style="color:#0f172a">Field Officer Operations Console</h2>
          <p class="text-muted mb-0">Manage assigned field grievances, update work status, and log resolution progress remarks.</p>
        </div>
        <button class="btn btn-outline-primary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-1.5" (click)="load()">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Refresh Assignments</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width:2.5rem;height:2.5rem;"></div>
        <p class="mt-2 text-muted small fw-medium">Loading your field assignment queue...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && complaints().length === 0" class="text-center py-5 bg-white rounded-4 border shadow-sm">
        <i class="bi bi-clipboard-check fs-1 text-slate-300 d-block mb-2"></i>
        <h5 class="fw-bold text-dark">No Active Assignments</h5>
        <p class="text-muted small mb-0">Your department head has not assigned any complaints to your queue.</p>
      </div>

      <!-- Stats Summary Grid -->
      <div *ngIf="!loading() && complaints().length > 0" class="row g-3 mb-4">
        <div class="col-sm-4">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border border-start border-4 border-primary">
            <div class="text-muted small text-uppercase fw-bold">Total Assigned</div>
            <div class="fs-2 fw-bold" style="color:#0f172a">{{ complaints().length }}</div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border border-start border-4 border-warning">
            <div class="text-muted small text-uppercase fw-bold">In Progress</div>
            <div class="fs-2 fw-bold text-warning">{{ countByStatus('IN_PROGRESS') }}</div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border border-start border-4 border-success">
            <div class="text-muted small text-uppercase fw-bold">Resolved</div>
            <div class="fs-2 fw-bold text-success">{{ countByStatus('RESOLVED') }}</div>
          </div>
        </div>
      </div>

      <!-- Complaint Cards Grid -->
      <div *ngIf="!loading()" class="row g-4">
        <div *ngFor="let c of complaints()" class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white border hover-card transition-all">
            <!-- Header -->
            <div class="card-header bg-white p-3 border-bottom d-flex justify-content-between align-items-center">
              <span class="badge badge-status" [ngClass]="getStatusClass(c.status)">
                {{ c.status.replace('_', ' ') }}
              </span>
              <span class="badge bg-slate-100 text-slate-700 border small fw-normal">{{ c.category }}</span>
            </div>

            <div class="card-body p-3.5 d-flex flex-column justify-content-between gap-3">
              <div>
                <h6 class="fw-bold mb-1 text-dark tracking-tight fs-6">{{ c.title }}</h6>
                <p class="text-muted small mb-2.5 text-truncate-3">{{ c.description }}</p>

                <div class="d-flex gap-3 flex-wrap small text-muted mb-2">
                  <span class="d-inline-flex align-items-center gap-1">
                    <i class="bi bi-geo-alt-fill text-danger opacity-75"></i> {{ c.areaName || c.pincode }}
                  </span>
                  <span class="d-inline-flex align-items-center gap-1">
                    <i class="bi bi-hand-thumbs-up-fill text-primary"></i> {{ c.upvoteCount }} upvotes
                  </span>
                </div>
                <div class="small text-muted font-monospace">Filed: {{ c.createdAt | date:'shortDate' }}</div>
              </div>

              <!-- Status Transition Action Panel -->
              <div *ngIf="getValidNextStatuses(c.status).length > 0" class="pt-3 border-top mt-auto">
                <div class="d-flex gap-2 flex-wrap mb-2">
                  <button *ngFor="let ns of getValidNextStatuses(c.status)"
                          class="btn btn-sm fw-bold rounded-pill d-inline-flex align-items-center gap-1"
                          [ngClass]="getNextStatusBtnClass(ns)"
                          (click)="openUpdateModal(c, ns)">
                    <i class="bi bi-arrow-right-short"></i>
                    <span>Set to {{ ns.replace('_', ' ') }}</span>
                  </button>
                </div>

                <div class="mt-2 bg-light p-2.5 rounded-3 border" *ngIf="activeComplaint?.id === c.id">
                  <label class="form-label small fw-bold text-muted text-uppercase mb-1">Remarks for {{ selectedNextStatus }}</label>
                  <textarea class="form-control form-control-sm rounded-3 mb-2 fs-6"
                    rows="2"
                    placeholder="Provide detailed progress or inspection remarks..."
                    [(ngModel)]="remarksInput">
                  </textarea>
                  <div class="d-flex gap-2">
                    <button class="btn btn-success btn-sm rounded-pill fw-bold px-3 d-inline-flex align-items-center gap-1"
                            (click)="submitStatusUpdate(c)"
                            [disabled]="!remarksInput.trim() || submitting">
                      <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="!submitting" class="bi bi-check-lg"></i>
                      <span>Confirm</span>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm rounded-pill" (click)="cancelUpdate()">
                      Cancel
                    </button>
                  </div>
                  <div *ngIf="successMsg" class="alert alert-success py-1 px-2 mt-2 small rounded-2 mb-0">
                    {{ successMsg }}
                  </div>
                </div>
              </div>

              <a [routerLink]="['/complaints', c.id]"
                 class="btn btn-outline-primary btn-sm rounded-3 w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1 mt-auto">
                <span>View Complete Details</span>
                <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-truncate-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
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
export class OfficerDashboardComponent implements OnInit {
  private api = inject(ApiService);

  complaints = signal<ComplaintDto[]>([]);
  loading = signal(true);

  activeComplaint: ComplaintDto | null = null;
  selectedNextStatus = '';
  remarksInput = '';
  submitting = false;
  successMsg = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getAssignedComplaints().subscribe({
      next: (data) => { this.complaints.set(data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  countByStatus(status: string): number {
    return this.complaints().filter(c => c.status === status).length;
  }

  getValidNextStatuses(currentStatus: string): string[] {
    switch (currentStatus) {
      case 'ASSIGNED': return ['IN_PROGRESS'];
      case 'IN_PROGRESS': return ['RESOLVED'];
      case 'RESOLVED': return ['REOPENED'];
      default: return [];
    }
  }

  openUpdateModal(c: ComplaintDto, ns: string): void {
    this.activeComplaint = c;
    this.selectedNextStatus = ns;
    this.remarksInput = '';
    this.successMsg = '';
  }

  cancelUpdate(): void {
    this.activeComplaint = null;
    this.selectedNextStatus = '';
    this.remarksInput = '';
  }

  submitStatusUpdate(c: ComplaintDto): void {
    if (!this.remarksInput.trim()) return;
    this.submitting = true;

    this.api.updateStatus(c.id, this.selectedNextStatus, this.remarksInput).subscribe({
      next: (updated) => {
        this.submitting = false;
        this.successMsg = `Status updated to ${this.selectedNextStatus}!`;
        this.complaints.update(list => list.map(item => item.id === c.id ? updated : item));
        setTimeout(() => {
          this.cancelUpdate();
          this.successMsg = '';
        }, 2000);
      },
      error: (err) => {
        this.submitting = false;
        this.successMsg = 'Error: ' + (err?.error?.message || 'Update failed.');
      }
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

  getNextStatusBtnClass(status: string): string {
    const map: Record<string,string> = {
      IN_PROGRESS: 'btn-warning text-dark', RESOLVED: 'btn-success text-white',
      REOPENED: 'btn-danger text-white', CLOSED: 'btn-dark'
    };
    return map[status] || 'btn-primary';
  }
}
