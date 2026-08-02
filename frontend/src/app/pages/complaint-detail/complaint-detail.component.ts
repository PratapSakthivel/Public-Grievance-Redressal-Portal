import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../services/complaint.service';
import { DepartmentService } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../../models/complaint.model';
import { User } from '../../models/user.model';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { TimeAgoPipe } from '../../shared/time-ago.pipe';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, TimeAgoPipe],
  template: `
    <div class="page-wrapper">
      @if (loading) {
        <div class="spinner"></div>
      } @else if (!complaint) {
        <div class="empty-state"><div class="icon">❌</div><h3>Complaint not found</h3></div>
      } @else {
        <div class="detail-layout">
          <!-- Main Content -->
          <div class="main-content">
            <!-- Header -->
            <div class="card mb-4">
              <div class="detail-header">
                <a routerLink="/public" class="back-link">← Back to Feed</a>
                <div class="header-badges">
                  <app-status-badge [status]="complaint.status"></app-status-badge>
                  <span class="badge" [class]="'badge-' + complaint.priority.toLowerCase()">{{ complaint.priority }}</span>
                </div>
              </div>
              <h1 class="detail-title">{{ complaint.title }}</h1>
              <p class="detail-desc">{{ complaint.description }}</p>

              <div class="meta-grid">
                <div class="meta-item-block"><span class="meta-key">Category</span><span class="meta-val">{{ complaint.category }}</span></div>
                <div class="meta-item-block"><span class="meta-key">Department</span><span class="meta-val">{{ complaint.departmentName }}</span></div>
                <div class="meta-item-block"><span class="meta-key">Area</span><span class="meta-val">{{ complaint.areaName }} ({{ complaint.pincode }})</span></div>
                <div class="meta-item-block"><span class="meta-key">Filed By</span><span class="meta-val">{{ complaint.citizenName }}</span></div>
                <div class="meta-item-block"><span class="meta-key">Filed</span><span class="meta-val">{{ complaint.createdAt | timeAgo }}</span></div>
                @if (complaint.assignedOfficerName) {
                  <div class="meta-item-block"><span class="meta-key">Officer</span><span class="meta-val">{{ complaint.assignedOfficerName }}</span></div>
                }
              </div>

              <div class="action-row">
                <button class="btn btn-secondary" [class.upvoted]="complaint.hasUpvoted" (click)="toggleUpvote()" [disabled]="!isLoggedIn">
                  ▲ {{ complaint.upvoteCount }} {{ complaint.hasUpvoted ? 'Upvoted' : 'Upvote' }}
                </button>
                @if (!isLoggedIn) {
                  <span class="text-muted text-sm">Login to upvote</span>
                }
              </div>
            </div>

            <!-- Officer Actions -->
            @if (canManage) {
              <div class="card mb-4">
                <h3 class="section-title">🛠 Officer Actions</h3>
                <div class="officer-actions">
                  @if (officers.length > 0) {
                    <div class="form-group">
                      <label class="form-label">Assign Officer</label>
                      <div class="flex gap-2">
                        <select class="form-control flex-1" [(ngModel)]="selectedOfficerId">
                          <option value="">-- Select Officer --</option>
                          <option *ngFor="let o of officers" [value]="o.id">{{ o.name }}</option>
                        </select>
                        <button class="btn btn-primary" (click)="assignOfficer()" [disabled]="!selectedOfficerId">Assign</button>
                      </div>
                    </div>
                  }
                  <div class="form-group">
                    <label class="form-label">Update Status</label>
                    <div class="flex gap-2 flex-wrap">
                      <select class="form-control flex-1" [(ngModel)]="newStatus">
                        <option value="">-- Select Status --</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                        <option value="REOPENED">Reopened</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Remarks</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="remarks" placeholder="Add remarks (optional)"></textarea>
                  </div>
                  <button class="btn btn-success" (click)="updateStatus()" [disabled]="!newStatus">Update Status</button>
                </div>
                @if (actionMsg) {
                  <div class="alert alert-success mt-3">✓ {{ actionMsg }}</div>
                }
              </div>
            }

            <!-- Timeline -->
            <div class="card">
              <h3 class="section-title">📋 Activity Timeline</h3>
              @if (complaint.timeline && complaint.timeline.length > 0) {
                <div class="timeline">
                  <div *ngFor="let entry of complaint.timeline" class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="tl-header">
                        <strong>{{ entry.actorName }}</strong>
                        <span class="tl-role">{{ entry.actorRole }}</span>
                      </div>
                      @if (entry.oldStatus && entry.newStatus) {
                        <div class="tl-transition">
                          <app-status-badge [status]="entry.oldStatus"></app-status-badge>
                          <span>→</span>
                          <app-status-badge [status]="entry.newStatus"></app-status-badge>
                        </div>
                      }
                      @if (entry.remarks) {
                        <p class="tl-remarks">{{ entry.remarks }}</p>
                      }
                      <div class="timeline-meta">{{ entry.createdAt | timeAgo }}</div>
                    </div>
                  </div>
                </div>
              } @else {
                <p class="text-muted text-sm">No activity recorded yet.</p>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="sidebar">
            <div class="card">
              <h4 class="section-title">📊 Complaint ID</h4>
              <div class="complaint-id">#{{ complaint.id }}</div>
            </div>
            @if (similar.length > 0) {
              <div class="card mt-4">
                <h4 class="section-title">🔗 Similar Open Complaints</h4>
                <div class="similar-list">
                  <a *ngFor="let s of similar" [routerLink]="['/complaints', s.id]" class="similar-item">
                    <span class="similar-title">{{ s.title | slice:0:50 }}...</span>
                    <span class="similar-upvotes">▲ {{ s.upvoteCount }}</span>
                  </a>
                </div>
              </div>
            }
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .back-link { color: var(--text-muted); font-size: 0.875rem; text-decoration: none; }
    .back-link:hover { color: var(--primary-light); }
    .header-badges { display: flex; gap: 0.5rem; }
    .detail-title { font-size: 1.625rem; font-weight: 700; margin-bottom: 0.75rem; line-height: 1.3; }
    .detail-desc { color: var(--text-muted); line-height: 1.7; margin-bottom: 1.25rem; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    .meta-item-block { display: flex; flex-direction: column; gap: 0.2rem; }
    .meta-key { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-val { font-size: 0.9rem; font-weight: 500; }
    .action-row { display: flex; align-items: center; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); }
    .btn.upvoted { background: rgba(99,102,241,0.2); color: #a5b4fc; border-color: rgba(99,102,241,0.4); }
    .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; }
    .officer-actions { display: flex; flex-direction: column; gap: 0.75rem; }
    .tl-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .tl-role { font-size: 0.75rem; background: rgba(99,102,241,0.1); color: #a5b4fc; padding: 0.1rem 0.5rem; border-radius: 100px; }
    .tl-transition { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .tl-remarks { font-size: 0.875rem; color: var(--text-muted); }
    .complaint-id { font-size: 2rem; font-weight: 800; color: var(--primary-light); }
    .similar-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .similar-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.03); text-decoration: none; transition: all 0.2s; }
    .similar-item:hover { background: rgba(99,102,241,0.08); }
    .similar-title { font-size: 0.825rem; color: var(--text); flex: 1; }
    .similar-upvotes { font-size: 0.75rem; color: #6366f1; font-weight: 600; white-space: nowrap; }
    @media(max-width: 1024px) { .detail-layout { grid-template-columns: 1fr; } .sidebar { order: -1; } }
    @media(max-width: 640px) { .meta-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class ComplaintDetailComponent implements OnInit {
  complaint: Complaint | null = null;
  loading = true;
  officers: User[] = [];
  similar: Complaint[] = [];
  selectedOfficerId: number | '' = '';
  newStatus = '';
  remarks = '';
  actionMsg: string | null = null;

  get isLoggedIn() { return this.authService.isLoggedIn(); }
  get canManage() { return this.authService.hasRole('OFFICER', 'DEPT_HEAD', 'SUPER_ADMIN'); }

  constructor(
    private route: ActivatedRoute,
    private complaintService: ComplaintService,
    private departmentService: DepartmentService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.complaintService.getComplaintById(id).subscribe({
      next: (c) => {
        this.complaint = c;
        this.loading = false;
        if (this.canManage) {
          this.departmentService.getOfficersByDepartment(c.departmentId).subscribe(
            officers => this.officers = officers
          );
        }
        this.complaintService.getSimilarComplaints(c.category, c.pincode).subscribe(
          list => this.similar = list.filter(s => s.id !== id).slice(0, 4)
        );
      },
      error: () => this.loading = false
    });
  }

  toggleUpvote() {
    if (!this.complaint) return;
    this.complaintService.toggleUpvote(this.complaint.id).subscribe(
      updated => this.complaint = updated
    );
  }

  assignOfficer() {
    if (!this.complaint || !this.selectedOfficerId) return;
    this.complaintService.assignOfficer(this.complaint.id, Number(this.selectedOfficerId)).subscribe(
      updated => { this.complaint = updated; this.actionMsg = 'Officer assigned successfully!'; this.clearMsg(); }
    );
  }

  updateStatus() {
    if (!this.complaint || !this.newStatus) return;
    this.complaintService.updateStatus(this.complaint.id, { newStatus: this.newStatus as any, remarks: this.remarks }).subscribe(
      updated => { this.complaint = updated; this.actionMsg = 'Status updated!'; this.newStatus = ''; this.remarks = ''; this.clearMsg(); }
    );
  }

  private clearMsg() { setTimeout(() => this.actionMsg = null, 3000); }
}
