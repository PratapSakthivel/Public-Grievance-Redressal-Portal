import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../../models/complaint.model';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">
          {{ isDeptHead ? '🏢 Department Dashboard' : '🧑‍⚖️ Officer Dashboard' }}
        </h1>
        <p class="page-subtitle">{{ user?.name }} · {{ user?.departmentName || 'No Department Assigned' }}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-4 mb-6">
        <div class="stat-card primary">
          <div class="stat-icon">📋</div>
          <div class="stat-value">{{ complaints.length }}</div>
          <div class="stat-label">Total Complaints</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">{{ byStatus('FILED') }}</div>
          <div class="stat-label">Awaiting Assignment</div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">🔄</div>
          <div class="stat-value">{{ byStatus('IN_PROGRESS') }}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ byStatus('RESOLVED') }}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>

      <!-- Tabs & Filters -->
      <div class="card mb-4">
        <div class="flex gap-3 flex-wrap mb-4">
          <button *ngFor="let tab of tabs" class="tab-btn" [class.active]="activeTab === tab.value" (click)="setTab(tab.value)">
            {{ tab.label }}
          </button>
        </div>
        <div class="flex gap-3 flex-wrap">
          <select class="form-control" style="max-width:180px" [(ngModel)]="filterStatus" (change)="applyFilter()">
            <option value="">All Statuses</option>
            <option value="FILED">Filed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select class="form-control" style="max-width:180px" [(ngModel)]="filterPriority" (change)="applyFilter()">
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <!-- Complaints Table -->
      @if (loading) {
        <div class="spinner"></div>
      } @else if (filtered.length === 0) {
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>No complaints found</h3>
        </div>
      } @else {
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Upvotes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of filtered">
                  <td><span class="complaint-num">{{ c.id }}</span></td>
                  <td>
                    <a [routerLink]="['/complaints', c.id]" class="complaint-link">{{ c.title | slice:0:60 }}</a>
                    <div class="complaint-area text-xs text-muted">{{ c.areaName }} · {{ c.pincode }}</div>
                  </td>
                  <td><app-status-badge [status]="c.status"></app-status-badge></td>
                  <td><span class="badge" [class]="'badge-' + c.priority.toLowerCase()">{{ c.priority }}</span></td>
                  <td><span class="text-sm">{{ c.category }}</span></td>
                  <td><strong>▲ {{ c.upvoteCount }}</strong></td>
                  <td>
                    <a [routerLink]="['/complaints', c.id]" class="btn btn-secondary btn-sm">Manage</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-btn {
      padding: 0.45rem 1rem; border-radius: 6px; border: 1px solid var(--border-subtle);
      background: transparent; color: var(--text-muted); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .tab-btn.active { background: rgba(99,102,241,0.15); color: #a5b4fc; border-color: rgba(99,102,241,0.35); }
    .complaint-num { font-weight: 700; color: var(--primary-light); }
    .complaint-link { color: var(--text); font-weight: 500; text-decoration: none; font-size: 0.9rem; }
    .complaint-link:hover { color: var(--primary-light); }
    .stat-card.info::before { background: linear-gradient(90deg, var(--info), var(--accent)); }
  `]
})
export class OfficerDashboardComponent implements OnInit {
  complaints: Complaint[] = [];
  filtered: Complaint[] = [];
  loading = true;
  activeTab = 'department';
  filterStatus = '';
  filterPriority = '';
  tabs = [
    { value: 'department', label: '🏢 Department' },
    { value: 'assigned', label: '👤 My Assigned' }
  ];

  get user() { return this.authService.currentUser; }
  get isDeptHead() { return this.authService.hasRole('DEPT_HEAD'); }

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService
  ) {}

  ngOnInit() { this.loadComplaints(); }

  setTab(tab: string) {
    this.activeTab = tab;
    this.loadComplaints();
  }

  loadComplaints() {
    this.loading = true;
    const obs$ = this.activeTab === 'assigned'
      ? this.complaintService.getAssignedComplaints()
      : this.complaintService.getDepartmentComplaints(this.user?.departmentId!);

    obs$.subscribe({
      next: (data) => { this.complaints = data; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter() {
    this.filtered = this.complaints.filter(c =>
      (!this.filterStatus || c.status === this.filterStatus) &&
      (!this.filterPriority || c.priority === this.filterPriority)
    );
  }

  byStatus(status: string) {
    return this.complaints.filter(c => c.status === status).length;
  }
}
