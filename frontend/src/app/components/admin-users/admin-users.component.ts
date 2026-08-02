import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold mb-1 tracking-tight" style="color:#0f172a">System User & Staff Governance</h2>
          <p class="text-muted mb-0">Provision Department Heads, Field Officers, and oversee system user accounts.</p>
        </div>
        <div class="d-flex gap-2">
          <a routerLink="/admin/analytics" class="btn btn-outline-primary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-1.5">
            <i class="bi bi-graph-up-arrow"></i>
            <span>Executive Analytics →</span>
          </a>
          <button class="btn btn-outline-secondary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-1" (click)="loadAll()">
            <i class="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Create Staff Form Card -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border">
        <div class="card-header bg-slate-900 text-white p-3.5" style="background:#0f172a">
          <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
            <i class="bi bi-person-plus-fill text-primary"></i>
            <span>Provision Staff Account</span>
          </h6>
          <small class="text-slate-400">Create Department Head or Field Officer accounts. Citizens self-register via the portal.</small>
        </div>
        <div class="card-body p-4">
          <form (ngSubmit)="createUser()">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted text-uppercase">Full Name</label>
                <input type="text" class="form-control rounded-3 fs-6" [(ngModel)]="form.name" name="name"
                       placeholder="e.g. Sanitation Dept Head" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted text-uppercase">Email Address</label>
                <input type="email" class="form-control rounded-3 fs-6" [(ngModel)]="form.email" name="email"
                       placeholder="e.g. sanitation.head@portal.gov" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted text-uppercase">Password</label>
                <input type="text" class="form-control rounded-3 fs-6" [(ngModel)]="form.password" name="password"
                       placeholder="Minimum 6 characters" required />
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted text-uppercase">Target Role</label>
                <select class="form-select rounded-3 fs-6" [(ngModel)]="form.role" name="role" required>
                  <option value="">-- Select Role --</option>
                  <option value="DEPT_HEAD">Department Head</option>
                  <option value="OFFICER">Field Officer</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted text-uppercase">Department</label>
                <select class="form-select rounded-3 fs-6" [(ngModel)]="form.departmentId" name="departmentId" required>
                  <option value="">-- Select Department --</option>
                  <option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</option>
                </select>
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <button type="submit" class="btn btn-primary w-100 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5"
                        [disabled]="creating()">
                  <span *ngIf="creating()" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!creating()" class="bi bi-person-check-fill"></i>
                  <span>Provision Account</span>
                </button>
              </div>
            </div>
            <div *ngIf="createSuccess" class="alert alert-success mt-3 py-2 px-3 small rounded-3 mb-0 d-flex align-items-center gap-2">
              <i class="bi bi-check-circle-fill"></i>
              <span>{{ createSuccess }}</span>
            </div>
            <div *ngIf="createError" class="alert alert-danger mt-3 py-2 px-3 small rounded-3 mb-0 d-flex align-items-center gap-2">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>{{ createError }}</span>
            </div>
          </form>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white border">
        <div class="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
          <h6 class="fw-bold mb-0 text-dark">Staff & Registered Users Directory</h6>
          <div class="d-flex gap-2">
            <select class="form-select form-select-sm rounded-3" style="width:170px" [(ngModel)]="roleFilter" (change)="filterUsers()">
              <option value="">All Account Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="DEPT_HEAD">Dept Head</option>
              <option value="OFFICER">Officer</option>
              <option value="CITIZEN">Citizen</option>
            </select>
          </div>
        </div>

        <div *ngIf="loading()" class="text-center py-4">
          <div class="spinner-border text-primary spinner-border-sm"></div>
          <span class="ms-2 text-muted small">Loading user directory...</span>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light" style="font-size:0.8rem">
              <tr>
                <th class="ps-4">Full Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Department</th>
                <th class="pe-4">Registered Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers()">
                <td class="ps-4">
                  <div class="fw-bold text-dark" style="font-size:0.9rem">{{ u.name }}</div>
                </td>
                <td><span class="text-muted small font-monospace">{{ u.email }}</span></td>
                <td>
                  <span class="badge rounded-pill px-2.5 py-1 small" [ngClass]="getRoleBadge(u.role)">
                    <i [class]="getRoleIcon(u.role)" class="me-1"></i> {{ getRoleLabel(u.role) }}
                  </span>
                </td>
                <td>
                  <span class="small text-dark d-inline-flex align-items-center gap-1" *ngIf="u.departmentName">
                    <i class="bi bi-building text-muted"></i> {{ u.departmentName }}
                  </span>
                  <span class="small text-muted" *ngIf="!u.departmentName">—</span>
                </td>
                <td class="pe-4"><span class="text-muted small font-monospace">{{ u.createdAt | date:'shortDate' }}</span></td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0 && !loading()">
                <td colspan="5" class="text-center py-4 text-muted small">No users found matching filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-slate-400 { color: #94a3b8; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);
  departments = signal<any[]>([]);
  loading = signal(true);
  creating = signal(false);

  roleFilter = '';
  createSuccess = '';
  createError = '';

  form = {
    name: '', email: '', password: 'password123',
    role: '', departmentId: ''
  };

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading.set(true);

    this.api.getAllUsers().subscribe({
      next: (all) => {
        this.users.set(all || []);
        this.filteredUsers.set(all || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.api.getDepartments().subscribe({
      next: (depts) => this.departments.set(depts || []),
      error: () => {}
    });
  }

  filterUsers(): void {
    if (!this.roleFilter) {
      this.filteredUsers.set(this.users());
    } else {
      this.filteredUsers.set(this.users().filter(u => u.role === this.roleFilter));
    }
  }

  createUser(): void {
    if (!this.form.name || !this.form.email || !this.form.role || !this.form.departmentId) return;
    this.creating.set(true);
    this.createSuccess = '';
    this.createError = '';

    const payload = {
      name: this.form.name,
      email: this.form.email,
      password: this.form.password,
      role: this.form.role,
      departmentId: this.form.departmentId
    };

    this.api.createStaffUser(payload).subscribe({
      next: (u) => {
        this.creating.set(false);
        this.createSuccess = `Account provisioned successfully: ${u.name} (${u.role})`;
        this.form = { name: '', email: '', password: 'password123', role: '', departmentId: '' };
        this.loadAll();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError = err?.error?.message || 'Failed to create user.';
      }
    });
  }

  getRoleBadge(role: string): string {
    const map: Record<string,string> = {
      SUPER_ADMIN: 'bg-danger text-white', DEPT_HEAD: 'bg-warning text-dark',
      OFFICER: 'bg-info text-dark', CITIZEN: 'bg-success text-white'
    };
    return map[role] || 'bg-secondary';
  }

  getRoleIcon(role: string): string {
    const map: Record<string,string> = {
      SUPER_ADMIN: 'bi bi-shield-shaded', DEPT_HEAD: 'bi bi-building',
      OFFICER: 'bi bi-person-badge-fill', CITIZEN: 'bi bi-person-check-fill'
    };
    return map[role] || 'bi bi-person';
  }

  getRoleLabel(role: string): string {
    const map: Record<string,string> = {
      SUPER_ADMIN: 'Super Admin', DEPT_HEAD: 'Dept Head',
      OFFICER: 'Officer', CITIZEN: 'Citizen'
    };
    return map[role] || role;
  }
}
