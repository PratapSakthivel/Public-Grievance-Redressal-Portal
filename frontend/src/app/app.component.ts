import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, AuthResponse } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <a routerLink="/public" class="nav-brand">
          <span class="brand-icon">⚖️</span>
          <span class="brand-text">GrievancePortal</span>
        </a>

        <div class="nav-links">
          <a routerLink="/public" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Public Feed</a>
          @if (currentUser) {
            @if (currentUser.role === 'CITIZEN') {
              <a routerLink="/dashboard" routerLinkActive="active">My Complaints</a>
              <a routerLink="/file-complaint" routerLinkActive="active" class="btn btn-primary btn-sm">+ File Complaint</a>
            }
            @if (currentUser.role === 'OFFICER' || currentUser.role === 'DEPT_HEAD') {
              <a routerLink="/officer-dashboard" routerLinkActive="active">Officer Panel</a>
            }
            @if (currentUser.role === 'SUPER_ADMIN') {
              <a routerLink="/admin" routerLinkActive="active">Admin</a>
            }
            <div class="nav-user" (click)="toggleMenu()" #userMenu>
              <span class="user-avatar">{{ currentUser.name.charAt(0).toUpperCase() }}</span>
              <span class="user-name">{{ currentUser.name }}</span>
              <span class="caret">▾</span>
              @if (menuOpen) {
                <div class="dropdown-menu">
                  <div class="dropdown-role">{{ currentUser.role | titlecase }}</div>
                  <hr class="dropdown-divider">
                  <button class="dropdown-item" (click)="logout()">Sign out</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="btn btn-secondary btn-sm">Login</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
          }
        </div>
      </div>
    </nav>

    @if (notification) {
      <div class="ws-notification" (click)="notification = null">
        <span>🔔</span> {{ notification }}
      </div>
    }

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(15,15,26,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(99,102,241,0.15);
      padding: 0 1.5rem;
    }
    .nav-inner {
      max-width: 1280px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 64px;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 0.625rem;
      text-decoration: none; font-weight: 800; font-size: 1.125rem;
      color: #e2e8f0;
    }
    .brand-icon { font-size: 1.5rem; }
    .brand-text {
      background: linear-gradient(135deg, #a5b4fc, #67e8f9);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .nav-links {
      display: flex; align-items: center; gap: 0.25rem;
    }
    .nav-links a {
      color: #94a3b8; font-size: 0.9rem; font-weight: 500;
      padding: 0.4rem 0.875rem; border-radius: 6px;
      transition: all 0.2s; text-decoration: none;
    }
    .nav-links a:hover, .nav-links a.active { color: #e2e8f0; background: rgba(99,102,241,0.1); }
    .nav-user {
      position: relative; display: flex; align-items: center; gap: 0.5rem;
      cursor: pointer; padding: 0.35rem 0.75rem; border-radius: 8px;
      border: 1px solid rgba(99,102,241,0.25);
      transition: all 0.2s;
    }
    .nav-user:hover { background: rgba(99,102,241,0.1); }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem; color: #fff;
    }
    .user-name { font-size: 0.875rem; color: #e2e8f0; font-weight: 500; }
    .caret { font-size: 0.7rem; color: #64748b; }
    .dropdown-menu {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #1a1a2e; border: 1px solid rgba(99,102,241,0.2);
      border-radius: 10px; padding: 0.5rem; min-width: 180px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .dropdown-role { padding: 0.4rem 0.75rem; font-size: 0.75rem; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .dropdown-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0.25rem 0; }
    .dropdown-item {
      display: block; width: 100%; text-align: left; background: none; border: none;
      padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #94a3b8; cursor: pointer;
      border-radius: 6px; transition: all 0.15s;
    }
    .dropdown-item:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }
    .ws-notification {
      position: fixed; top: 72px; right: 1.5rem; z-index: 999;
      background: rgba(26,26,46,0.95); border: 1px solid rgba(99,102,241,0.3);
      border-radius: 8px; padding: 0.75rem 1.25rem;
      display: flex; align-items: center; gap: 0.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4); font-size: 0.9rem;
      cursor: pointer; animation: slideDown 0.3s ease;
    }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser: AuthResponse | null = null;
  menuOpen = false;
  notification: string | null = null;
  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subs.add(
      this.authService.currentUser$.subscribe(u => {
        this.currentUser = u;
        if (u) this.wsService.connect();
      })
    );
    this.subs.add(
      this.wsService.messages$.subscribe(msg => {
        if (msg.event === 'NEW_COMPLAINT') {
          this.notification = `New complaint filed: "${msg.title}"`;
          setTimeout(() => this.notification = null, 5000);
        } else if (msg.event === 'STATUS_UPDATE') {
          this.notification = `Complaint #${msg.complaintId} status: ${msg.status}`;
          setTimeout(() => this.notification = null, 5000);
        }
      })
    );
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }

  logout() {
    this.menuOpen = false;
    this.authService.logout();
  }

  ngOnDestroy() { this.subs.unsubscribe(); }
}
