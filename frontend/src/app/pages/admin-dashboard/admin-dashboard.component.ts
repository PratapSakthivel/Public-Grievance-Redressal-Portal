import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsService, AnalyticsData } from '../../services/analytics.service';
import { DepartmentService } from '../../services/department.service';
import { UserService } from '../../services/user.service';
import { Department } from '../../models/department.model';
import { User } from '../../models/user.model';
import { ComplaintService } from '../../services/complaint.service';
import { Complaint } from '../../models/complaint.model';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">🛡 Admin Dashboard</h1>
        <p class="page-subtitle">System-wide overview, analytics and management.</p>
      </div>

      <!-- Analytics Stats -->
      @if (analytics) {
        <div class="grid grid-4 mb-6">
          <div class="stat-card primary">
            <div class="stat-icon">📋</div>
            <div class="stat-value gradient-text">{{ analytics.totalComplaints }}</div>
            <div class="stat-label">Total Complaints</div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ analytics.resolvedComplaints }}</div>
            <div class="stat-label">Resolved</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">{{ analytics.pendingComplaints }}</div>
            <div class="stat-label">Pending</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-icon">⏱</div>
            <div class="stat-value">{{ analytics.averageResolutionTime | number:'1.0-0' }}h</div>
            <div class="stat-label">Avg Resolution Time</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-2 mb-6">
          <!-- Status Breakdown -->
          <div class="card">
            <h3 class="section-title">📊 Status Breakdown</h3>
            <div class="bar-chart">
              <div *ngFor="let item of statusItems" class="bar-item">
                <div class="bar-label">{{ item.key }}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="getPercent(item.val, analytics!.totalComplaints)" [class]="'fill-' + item.key.toLowerCase()"></div>
                </div>
                <div class="bar-val">{{ item.val }}</div>
              </div>
            </div>
          </div>

          <!-- Category Distribution -->
          <div class="card">
            <h3 class="section-title">🏷 Top Categories</h3>
            <div class="category-list">
              <div *ngFor="let item of categoryItems | slice:0:7" class="category-row">
                <span class="category-name">{{ item.key }}</span>
                <div class="category-bar-track">
                  <div class="category-bar" [style.width.%]="getPercent(item.val, maxCategory)"></div>
                </div>
                <span class="category-count">{{ item.val }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Pincodes -->
        @if (analytics.topPincodes.length > 0) {
          <div class="card mb-6">
            <h3 class="section-title">📍 Hotspot Areas</h3>
            <div class="pincode-grid">
              <div *ngFor="let p of analytics.topPincodes; let i = index" class="pincode-card">
                <div class="pincode-rank">#{{ i + 1 }}</div>
                <div class="pincode-code">{{ p.pincode }}</div>
                <div class="pincode-count">{{ p.count }} complaints</div>
              </div>
            </div>
          </div>
        }
      }

      <!-- Management Tabs -->
      <div class="card">
        <div class="flex gap-3 mb-6">
          <button *ngFor="let t of adminTabs" class="tab-btn" [class.active]="activeTab === t.value" (click)="activeTab = t.value">
            {{ t.label }}
          </button>
        </div>

        <!-- Departments Tab -->
        @if (activeTab === 'departments') {
          <div class="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Head</th></tr></thead>
              <tbody>
                <tr *ngFor="let d of departments">
                  <td>{{ d.id }}</td>
                  <td><strong>{{ d.name }}</strong></td>
                  <td class="text-muted text-sm">{{ d.description | slice:0:60 }}</td>
                  <td>{{ d.deptHead?.name || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        }

        <!-- Users Tab -->
        @if (activeTab === 'users') {
          <div class="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Dept</th></tr></thead>
              <tbody>
                <tr *ngFor="let u of users">
                  <td>{{ u.id }}</td>
                  <td><strong>{{ u.name }}</strong></td>
                  <td class="text-muted text-sm">{{ u.email }}</td>
                  <td><span class="role-tag">{{ u.role }}</span></td>
                  <td class="text-muted text-sm">{{ u.departmentId || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        }

        <!-- All Complaints Tab -->
        @if (activeTab === 'complaints') {
          <div class="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Dept</th><th>Action</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of complaints">
                  <td>{{ c.id }}</td>
                  <td><a [routerLink]="['/complaints', c.id]" class="complaint-link">{{ c.title | slice:0:50 }}</a></td>
                  <td><app-status-badge [status]="c.status"></app-status-badge></td>
                  <td><span class="badge" [class]="'badge-' + c.priority.toLowerCase()">{{ c.priority }}</span></td>
                  <td class="text-sm text-muted">{{ c.departmentName }}</td>
                  <td><a [routerLink]="['/complaints', c.id]" class="btn btn-secondary btn-sm">View</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      padding: 0.45rem 1rem; border-radius: 6px; border: 1px solid var(--border-subtle);
      background: transparent; color: var(--text-muted); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .tab-btn.active { background: rgba(99,102,241,0.15); color: #a5b4fc; border-color: rgba(99,102,241,0.35); }
    .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
    .bar-chart { display: flex; flex-direction: column; gap: 0.75rem; }
    .bar-item { display: flex; align-items: center; gap: 0.75rem; }
    .bar-label { width: 100px; font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize; }
    .bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; background: var(--primary); }
    .fill-resolved { background: var(--success); } .fill-filed { background: var(--primary); }
    .fill-in_progress { background: var(--accent); } .fill-assigned { background: var(--warning); }
    .fill-closed { background: var(--text-dim); } .fill-reopened { background: var(--danger); }
    .bar-val { font-size: 0.8rem; font-weight: 600; width: 30px; text-align: right; }
    .category-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .category-row { display: flex; align-items: center; gap: 0.75rem; }
    .category-name { font-size: 0.8rem; color: var(--text-muted); width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .category-bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
    .category-bar { height: 100%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 4px; }
    .category-count { font-size: 0.8rem; font-weight: 600; width: 30px; text-align: right; }
    .pincode-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
    .pincode-card {
      background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
      border-radius: 10px; padding: 1rem 1.5rem; text-align: center; min-width: 120px;
    }
    .pincode-rank { font-size: 0.75rem; color: var(--text-dim); }
    .pincode-code { font-size: 1.25rem; font-weight: 800; color: #a5b4fc; }
    .pincode-count { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
    .role-tag {
      font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 100px;
      background: rgba(99,102,241,0.1); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2);
    }
    .complaint-link { color: var(--text); text-decoration: none; font-size: 0.875rem; }
    .complaint-link:hover { color: var(--primary-light); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  analytics: AnalyticsData | null = null;
  departments: Department[] = [];
  users: User[] = [];
  complaints: Complaint[] = [];
  activeTab = 'departments';
  adminTabs = [
    { value: 'departments', label: '🏢 Departments' },
    { value: 'users', label: '👥 Users' },
    { value: 'complaints', label: '📋 All Complaints' }
  ];

  get statusItems() {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.statusBreakdown).map(([key, val]) => ({ key, val }));
  }

  get categoryItems() {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.categoryDistribution)
      .map(([key, val]) => ({ key, val }))
      .sort((a, b) => b.val - a.val);
  }

  get maxCategory(): number {
    return Math.max(1, ...this.categoryItems.map(i => i.val));
  }

  getPercent(val: number, total: number) { return total > 0 ? Math.round((val / total) * 100) : 0; }

  constructor(
    private analyticsService: AnalyticsService,
    private departmentService: DepartmentService,
    private userService: UserService,
    private complaintService: ComplaintService
  ) {}

  ngOnInit() {
    this.analyticsService.getGlobalStats().subscribe(d => this.analytics = d);
    this.departmentService.getAllDepartments().subscribe(d => this.departments = d);
    this.userService.getAllUsers().subscribe(u => this.users = u);
    this.complaintService.getPublicFeed().subscribe(c => this.complaints = c);
  }
}
