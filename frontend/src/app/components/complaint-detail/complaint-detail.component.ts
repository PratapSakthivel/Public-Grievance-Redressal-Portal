import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ApiService, ComplaintDetail, ComplaintDto } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Loading / Error -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width:3rem;height:3rem;"></div>
        <p class="mt-3 text-muted">Loading grievance audit trail...</p>
      </div>

      <div *ngIf="errorMessage()" class="alert alert-danger rounded-4 p-4 my-4 shadow-sm">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-exclamation-octagon-fill fs-2"></i>
          <div>
            <h5 class="fw-bold mb-1">Error Loading Grievance</h5>
            <p class="mb-0">{{ errorMessage() }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="!loading() && detail()" class="row g-4">
        <!-- Main Detail Column -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border">
            <!-- Header Bar -->
            <div class="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge bg-slate-100 text-slate-700 font-monospace border border-slate-200 rounded-2 px-2.5 py-1 text-uppercase fw-semibold">
                    {{ detail()?.complaint?.category }}
                  </span>
                  <span class="badge badge-status" [ngClass]="getStatusClass(detail()?.complaint?.status || '')">
                    {{ (detail()?.complaint?.status || '').replace('_', ' ') }}
                  </span>
                  <span class="badge rounded-2 px-2 py-1 small" [ngClass]="getPriorityClass(detail()?.complaint?.priority || '')">
                    {{ detail()?.complaint?.priority }} PRIORITY
                  </span>
                </div>
                <h3 class="fw-bold text-dark mb-1 tracking-tight">{{ detail()?.complaint?.title }}</h3>
                <div class="text-muted small font-monospace">Grievance ID: {{ detail()?.complaint?.id }}</div>
              </div>

              <!-- Upvote Action Button -->
              <div>
                <button *ngIf="isCitizen()"
                        class="btn rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2 shadow-sm transition-all"
                        [ngClass]="detail()?.hasUpvoted ? 'btn-outline-danger' : 'btn-primary'"
                        (click)="toggleUpvote()"
                        [disabled]="upvoting()">
                  <i [class]="detail()?.hasUpvoted ? 'bi bi-hand-thumbs-down-fill' : 'bi bi-hand-thumbs-up-fill'"></i>
                  <span>{{ detail()?.hasUpvoted ? 'Remove Upvote' : 'Upvote Issue' }}</span>
                  <span class="badge bg-white text-dark rounded-circle px-2 py-1 ms-1 small">
                    {{ detail()?.complaint?.upvoteCount }}
                  </span>
                </button>

                <div *ngIf="!isCitizen()" class="text-end">
                  <div class="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill fs-6 d-inline-flex align-items-center gap-1.5">
                    <i class="bi bi-hand-thumbs-up-fill"></i>
                    <span>{{ detail()?.complaint?.upvoteCount }} Community Upvotes</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Body -->
            <div class="card-body p-4">
              <h6 class="fw-bold text-uppercase text-muted small mb-2">Description</h6>
              <p class="text-dark leading-relaxed mb-4 fs-6" style="white-space: pre-line;">
                {{ detail()?.complaint?.description }}
              </p>

              <!-- Metadata Grid -->
              <div class="row g-3 p-3 bg-light rounded-3 border">
                <div class="col-sm-6 col-md-3">
                  <div class="text-muted small text-uppercase fw-bold">Citizen</div>
                  <div class="fw-semibold text-dark small d-flex align-items-center gap-1 mt-0.5">
                    <i class="bi bi-person-fill text-muted"></i>
                    <span>{{ detail()?.complaint?.citizenName }}</span>
                  </div>
                </div>

                <div class="col-sm-6 col-md-3">
                  <div class="text-muted small text-uppercase fw-bold">Department</div>
                  <div class="fw-semibold text-dark small d-flex align-items-center gap-1 mt-0.5">
                    <i class="bi bi-building text-muted"></i>
                    <span>{{ detail()?.complaint?.departmentName || 'Unassigned' }}</span>
                  </div>
                </div>

                <div class="col-sm-6 col-md-3">
                  <div class="text-muted small text-uppercase fw-bold">Field Officer</div>
                  <div class="fw-semibold text-dark small d-flex align-items-center gap-1 mt-0.5">
                    <i class="bi bi-person-badge text-muted"></i>
                    <span>{{ detail()?.complaint?.assignedOfficerName || 'Pending Assignment' }}</span>
                  </div>
                </div>

                <div class="col-sm-6 col-md-3">
                  <div class="text-muted small text-uppercase fw-bold">Location</div>
                  <div class="fw-semibold text-dark small d-flex align-items-center gap-1 mt-0.5">
                    <i class="bi bi-geo-alt-fill text-danger"></i>
                    <span>{{ detail()?.complaint?.areaName || detail()?.complaint?.pincode }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audit Timeline Card -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white border">
            <div class="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <i class="bi bi-clock-history text-primary"></i>
                <span>Audit Trail & Progress History</span>
              </h5>
              <span class="badge bg-slate-100 text-slate-700 font-monospace border rounded-2 px-2.5 py-1">
                {{ detail()?.timeline?.length || 0 }} Events
              </span>
            </div>

            <div class="card-body p-4">
              <div *ngIf="!detail()?.timeline || detail()?.timeline?.length === 0" class="text-muted small py-3">
                No timeline records available for this grievance.
              </div>

              <div class="timeline ps-3">
                <div *ngFor="let item of detail()?.timeline" class="timeline-item position-relative pb-4 ps-4 border-start border-2 border-slate-200">
                  <div class="timeline-dot position-absolute start-0 translate-middle bg-primary rounded-circle" style="width:12px;height:12px;left:-1px !important;"></div>
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge badge-status" [ngClass]="getStatusClass(item.newStatus)">
                      {{ item.newStatus.replace('_', ' ') }}
                    </span>
                    <span class="text-muted small font-monospace">{{ item.createdAt | date:'medium' }}</span>
                  </div>
                  <div class="fw-semibold text-dark small">{{ item.actorName }} <span class="badge bg-light text-dark border ms-1">{{ item.actorRole }}</span></div>
                  <p *ngIf="item.remarks" class="text-muted small mb-0 mt-1 bg-light p-2.5 rounded-3 border">
                    "{{ item.remarks }}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: Officer Assignment & Status Updates -->
        <div class="col-lg-4">
          <!-- Officer Assignment Card (Dept Head or Super Admin) -->
          <div *ngIf="canAssignOfficer()" class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border">
            <div class="card-header bg-primary text-white p-3">
              <h6 class="fw-bold mb-0 d-flex align-items-center gap-1.5">
                <i class="bi bi-person-plus-fill"></i>
                <span>Assign / Reassign Officer</span>
              </h6>
            </div>
            <div class="card-body p-3.5">
              <label class="form-label small fw-bold text-muted text-uppercase mb-2">Select Field Officer</label>
              <select class="form-select rounded-3 mb-3 fs-6" [(ngModel)]="selectedOfficerId">
                <option value="">-- Choose Officer --</option>
                <option *ngFor="let o of officers()" [value]="o.id">
                  {{ o.name }} ({{ o.departmentName || 'Staff' }})
                </option>
              </select>

              <button class="btn btn-primary w-100 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5"
                      (click)="assignOfficer()"
                      [disabled]="!selectedOfficerId || updating()">
                <span *ngIf="updating()" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!updating()" class="bi bi-check-circle-fill"></i>
                <span>Assign Field Officer</span>
              </button>

              <div *ngIf="assignSuccess" class="alert alert-success py-2 px-3 small rounded-3 mt-3 mb-0">
                ✅ {{ assignSuccess }}
              </div>
            </div>
          </div>

          <!-- Status Transition Card (Officer or Dept Head) -->
          <div *ngIf="canUpdateStatus()" class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border">
            <div class="card-header bg-dark text-white p-3">
              <h6 class="fw-bold mb-0 d-flex align-items-center gap-1.5">
                <i class="bi bi-arrow-repeat"></i>
                <span>Update Grievance Status</span>
              </h6>
            </div>
            <div class="card-body p-3.5">
              <label class="form-label small fw-bold text-muted text-uppercase mb-2">Target Status</label>
              <select class="form-select rounded-3 mb-3 fs-6" [(ngModel)]="selectedNextStatus">
                <option value="">-- Select Next Status --</option>
                <option *ngFor="let s of getValidNextStatuses()" [value]="s">
                  {{ s.replace('_', ' ') }}
                </option>
              </select>

              <label class="form-label small fw-bold text-muted text-uppercase mb-2">Progress Remarks</label>
              <textarea class="form-control rounded-3 mb-3 fs-6" rows="3" [(ngModel)]="statusRemarks" placeholder="Enter status update details or inspection notes..."></textarea>

              <button class="btn btn-dark w-100 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5"
                      (click)="submitStatusUpdate()"
                      [disabled]="!selectedNextStatus || updating()">
                <span *ngIf="updating()" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!updating()" class="bi bi-arrow-right-circle-fill"></i>
                <span>Update Status</span>
              </button>

              <div *ngIf="statusSuccess" class="alert alert-success py-2 px-3 small rounded-3 mt-3 mb-0">
                ✅ {{ statusSuccess }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-slate-100 { background-color: #f1f5f9; }
    .text-slate-700 { color: #334155; }
    .border-slate-200 { border-color: #e2e8f0; }
  `]
})
export class ComplaintDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);

  detail = signal<ComplaintDetail | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  officers = signal<any[]>([]);
  selectedOfficerId = '';
  assignSuccess = '';

  selectedNextStatus = '';
  statusRemarks = '';
  statusSuccess = '';

  upvoting = signal(false);
  updating = signal(false);

  private detailChannel: RealtimeChannel | null = null;
  private complaintId = '';

  ngOnInit(): void {
    this.complaintId = this.route.snapshot.paramMap.get('id') || '';
    if (this.complaintId) {
      this.loadDetail();
      this.initRealtimeSubscription();
      this.loadOfficersIfEligible();
    }
  }

  ngOnDestroy(): void {
    if (this.detailChannel) {
      this.supabaseService.unsubscribe(this.detailChannel);
    }
  }

  loadDetail(): void {
    this.loading.set(true);
    this.apiService.getComplaintDetail(this.complaintId).subscribe({
      next: (res) => {
        this.detail.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load complaint details.');
      }
    });
  }

  loadOfficersIfEligible(): void {
    const user = this.apiService.getCurrentUser();
    if (user && (user.role === 'DEPT_HEAD' || user.role === 'SUPER_ADMIN')) {
      this.apiService.getOfficers(user.departmentId).subscribe({
        next: (list) => this.officers.set(list || []),
        error: () => {}
      });
    }
  }

  toggleUpvote(): void {
    if (!this.detail() || this.upvoting()) return;
    this.upvoting.set(true);

    const hasUpvoted = this.detail()?.hasUpvoted;
    const req = hasUpvoted
      ? this.apiService.removeUpvote(this.complaintId)
      : this.apiService.upvote(this.complaintId);

    req.subscribe({
      next: (res) => {
        this.upvoting.set(false);
        const current = this.detail();
        if (current) {
          this.detail.set({
            ...current,
            hasUpvoted: !hasUpvoted,
            complaint: {
              ...current.complaint,
              upvoteCount: res.upvoteCount
            }
          });
        }
      },
      error: () => this.upvoting.set(false)
    });
  }

  assignOfficer(): void {
    if (!this.selectedOfficerId) return;
    this.updating.set(true);
    this.assignSuccess = '';

    this.apiService.assignOfficer(this.complaintId, this.selectedOfficerId).subscribe({
      next: () => {
        this.updating.set(false);
        this.assignSuccess = 'Officer assigned successfully!';
        this.loadDetail();
      },
      error: () => this.updating.set(false)
    });
  }

  submitStatusUpdate(): void {
    if (!this.selectedNextStatus) return;
    this.updating.set(true);
    this.statusSuccess = '';

    this.apiService.updateStatus(this.complaintId, this.selectedNextStatus, this.statusRemarks).subscribe({
      next: () => {
        this.updating.set(false);
        this.statusSuccess = 'Status updated successfully!';
        this.selectedNextStatus = '';
        this.statusRemarks = '';
        this.loadDetail();
      },
      error: () => this.updating.set(false)
    });
  }

  isCitizen(): boolean {
    const user = this.apiService.getCurrentUser();
    return user?.role === 'CITIZEN';
  }

  canAssignOfficer(): boolean {
    const user = this.apiService.getCurrentUser();
    return user?.role === 'DEPT_HEAD' || user?.role === 'SUPER_ADMIN';
  }

  canUpdateStatus(): boolean {
    const user = this.apiService.getCurrentUser();
    return user?.role === 'OFFICER' || user?.role === 'DEPT_HEAD' || user?.role === 'SUPER_ADMIN';
  }

  getValidNextStatuses(): string[] {
    const current = this.detail()?.complaint?.status;
    switch (current) {
      case 'FILED': return ['ASSIGNED', 'IN_PROGRESS'];
      case 'ASSIGNED': return ['IN_PROGRESS'];
      case 'IN_PROGRESS': return ['RESOLVED'];
      case 'RESOLVED': return ['REOPENED', 'CLOSED'];
      case 'REOPENED': return ['IN_PROGRESS', 'RESOLVED'];
      default: return [];
    }
  }

  private initRealtimeSubscription(): void {
    this.detailChannel = this.supabaseService.subscribeToComplaint(this.complaintId, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const current = this.detail();
        if (current) {
          this.detail.set({
            ...current,
            complaint: {
              ...current.complaint,
              status: payload.new.status,
              upvoteCount: payload.new.upvote_count
            }
          });
        }
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

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'bg-danger text-white';
      case 'MEDIUM': return 'bg-warning text-dark';
      default: return 'bg-secondary text-white';
    }
  }
}
