import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="app-navbar sticky-top">
      <div class="container">
        <div class="navbar-inner">

          <!-- ── Brand ── -->
          <a class="brand" routerLink="/">
            <div class="brand-icon">
              <i class="bi bi-shield-check"></i>
            </div>
            <div class="brand-text">
              <span class="brand-name">GrievancePortal</span>
              <span class="brand-sub">Public Governance Unit</span>
            </div>
          </a>

          <!-- ── Nav Links ── -->
          <ul class="nav-links">
            <li>
              <a class="nav-pill" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
                <i class="bi bi-globe2"></i>
                <span>Public Feed</span>
              </a>
            </li>

            <!-- CITIZEN -->
            <ng-container *ngIf="user?.role === 'CITIZEN'">
              <li>
                <a class="nav-pill" routerLink="/my-complaints" routerLinkActive="active">
                  <i class="bi bi-journal-text"></i>
                  <span>My Grievances</span>
                </a>
              </li>
              <li>
                <a class="nav-pill nav-pill-accent" routerLink="/file-complaint" routerLinkActive="active">
                  <i class="bi bi-plus-circle"></i>
                  <span>File Grievance</span>
                </a>
              </li>
            </ng-container>

            <!-- OFFICER -->
            <li *ngIf="user?.role === 'OFFICER'">
              <a class="nav-pill" routerLink="/officer/dashboard" routerLinkActive="active">
                <i class="bi bi-briefcase"></i>
                <span>My Assignments</span>
              </a>
            </li>

            <!-- DEPT HEAD -->
            <li *ngIf="user?.role === 'DEPT_HEAD'">
              <a class="nav-pill" routerLink="/dept-head/dashboard" routerLinkActive="active">
                <i class="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </a>
            </li>

            <!-- SUPER ADMIN -->
            <ng-container *ngIf="user?.role === 'SUPER_ADMIN'">
              <li>
                <a class="nav-pill" routerLink="/admin/analytics" routerLinkActive="active">
                  <i class="bi bi-graph-up-arrow"></i>
                  <span>Analytics</span>
                </a>
              </li>
              <li>
                <a class="nav-pill" routerLink="/admin/users" routerLinkActive="active">
                  <i class="bi bi-people"></i>
                  <span>Users</span>
                </a>
              </li>
            </ng-container>

            <!-- Guest: File Grievance -->
            <li *ngIf="!user">
              <a class="nav-pill nav-pill-accent" routerLink="/file-complaint" routerLinkActive="active">
                <i class="bi bi-plus-circle"></i>
                <span>File Grievance</span>
              </a>
            </li>
          </ul>

          <!-- ── User Area ── -->
          <div class="user-area">
            <ng-container *ngIf="isLoggedIn(); else loginBlock">
              <div class="user-profile">
                <div class="user-avatar">{{ getUserInitials() }}</div>
                <div class="user-info">
                  <span class="user-name">{{ getDisplayName() }}</span>
                  <span class="role-badge" [ngClass]="'role-' + (user?.role || 'default').toLowerCase()">
                    {{ getRoleLabel(user?.role) }}
                  </span>
                </div>
              </div>
              <button class="btn-logout" (click)="logout()">
                <i class="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </button>
            </ng-container>

            <ng-template #loginBlock>
              <a routerLink="/login" class="btn-signin">
                <i class="bi bi-person-circle"></i>
                <span>Sign In</span>
              </a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* ─── Navbar Shell ─── */
    .app-navbar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 8px rgba(15, 23, 42, 0.06);
      z-index: 1030;
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      gap: 1rem;
      height: 64px;
    }

    /* ─── Brand ─── */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
      margin-right: 1rem;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5, #2563eb);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1.05rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1;
      gap: 2px;
    }

    .brand-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 0.58rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    /* ─── Nav Links ─── */
    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
      flex: 1;
    }

    .nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 0.845rem;
      font-weight: 500;
      color: #475569;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .nav-pill i {
      font-size: 0.95rem;
      line-height: 1;
    }

    .nav-pill:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .nav-pill.active {
      background: #4f46e5;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
    }

    .nav-pill.active i {
      color: #ffffff;
    }

    .nav-pill-accent {
      color: #4f46e5;
      border: 1px solid #c7d2fe;
      background: #eef2ff;
    }

    .nav-pill-accent:hover {
      background: #e0e7ff;
      color: #3730a3;
    }

    .nav-pill-accent.active {
      background: #4f46e5;
      color: #ffffff;
      border-color: transparent;
    }

    /* ─── User Area ─── */
    .user-area {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 9px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 99px;
      padding: 5px 12px 5px 6px;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #2563eb);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .user-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #1e293b;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .role-badge {
      font-size: 0.67rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .role-citizen       { background: #d1fae5; color: #065f46; }
    .role-officer       { background: #dbeafe; color: #1e40af; }
    .role-dept_head     { background: #fef3c7; color: #92400e; }
    .role-super_admin   { background: #fee2e2; color: #991b1b; }
    .role-default       { background: #f1f5f9; color: #475569; }

    /* ─── Logout Button ─── */
    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid #fecaca;
      background: transparent;
      color: #dc2626;
      font-size: 0.83rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-logout:hover {
      background: #fef2f2;
      border-color: #dc2626;
    }

    /* ─── Sign In Button ─── */
    .btn-signin {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      border-radius: 99px;
      background: #4f46e5;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    }

    .btn-signin:hover {
      background: #4338ca;
      color: #ffffff;
    }
  `]
})
export class NavbarComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);

  get user(): any {
    return this.apiService.getCurrentUser();
  }

  isLoggedIn(): boolean {
    return this.apiService.isLoggedIn();
  }

  logout(): void {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  getDisplayName(): string {
    const u = this.user;
    if (!u) return '';
    if (u.name) return u.name.split(' ')[0]; // first name only to save space
    return u.email?.split('@')[0] || 'User';
  }

  getUserInitials(): string {
    const name = this.user?.name || this.user?.email || 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      CITIZEN: 'Citizen',
      OFFICER: 'Officer',
      DEPT_HEAD: 'Dept Head',
      SUPER_ADMIN: 'Super Admin'
    };
    return map[role] || role;
  }
}
