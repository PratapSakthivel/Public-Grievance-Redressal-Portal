import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-5">
          <div class="card border-0 shadow-lg rounded-4 overflow-hidden bg-white border">
            <!-- Header -->
            <div class="card-header bg-white text-center p-4 border-bottom">
              <div class="d-inline-flex align-items-center justify-content-center text-white rounded-circle mb-2 shadow-sm" style="width:52px;height:52px;font-size:1.4rem;background:linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);">
                <i class="bi bi-shield-lock-fill"></i>
              </div>
              <h3 class="fw-bold mb-1 tracking-tight text-dark">Portal Sign In</h3>
              <p class="text-muted small mb-0">Access your grievance console or choose a quick demo account</p>
            </div>

            <div class="card-body p-4 bg-white">
              <!-- Quick Role Fill Demo Profile Buttons -->
              <div class="mb-4">
                <label class="form-label small text-muted font-weight-bold text-uppercase tracking-wider mb-2 d-flex align-items-center gap-1.5">
                  <i class="bi bi-lightning-charge-fill text-warning"></i>
                  <span>Quick Demo Login Profiles</span>
                </label>
                <div class="d-flex flex-wrap gap-2">
                  <button type="button" class="btn btn-outline-primary btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('admin@portal.gov', 'Admin@123456')">
                    <i class="bi bi-shield-shaded"></i> Super Admin
                  </button>
                  <button type="button" class="btn btn-outline-info btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('water.head@portal.gov', 'password123')">
                    <i class="bi bi-droplet-fill"></i> Water Head
                  </button>
                  <button type="button" class="btn btn-outline-warning btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('roads.head@portal.gov', 'password123')">
                    <i class="bi bi-cone-striped"></i> Roads Head
                  </button>
                  <button type="button" class="btn btn-outline-success btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('water.officer1@portal.gov', 'password123')">
                    <i class="bi bi-person-badge"></i> Water Officer
                  </button>
                  <button type="button" class="btn btn-outline-success btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('roads.officer1@portal.gov', 'password123')">
                    <i class="bi bi-person-badge"></i> Roads Officer
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('citizen1@example.com', 'password123')">
                    <i class="bi bi-person-check-fill"></i> Citizen 1
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1" (click)="quickLogin('citizen2@example.com', 'password123')">
                    <i class="bi bi-person-check-fill"></i> Citizen 2
                  </button>
                </div>
              </div>

              <hr class="my-4" style="border-color:#e2e8f0;" />

              <form (ngSubmit)="onLogin()">
                <div class="mb-3">
                  <label class="form-label text-dark font-weight-medium small text-uppercase">Email Address</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0 text-muted d-flex align-items-center justify-content-center px-3"><i class="bi bi-envelope"></i></span>
                    <input type="email" class="form-control form-control-lg rounded-end-3 border-start-0 fs-6" [(ngModel)]="email" name="email" placeholder="name@example.com" required />
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label text-dark font-weight-medium small text-uppercase">Password</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0 text-muted d-flex align-items-center justify-content-center px-3"><i class="bi bi-key"></i></span>
                    <input type="password" class="form-control form-control-lg rounded-end-3 border-start-0 fs-6" [(ngModel)]="password" name="password" placeholder="••••••••" required />
                  </div>
                </div>

                <div *ngIf="errorMessage" class="alert alert-danger rounded-3 py-2.5 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <span>{{ errorMessage }}</span>
                </div>

                <button type="submit" class="btn btn-indigo btn-lg w-100 rounded-3 font-weight-bold shadow-sm d-inline-flex align-items-center justify-content-center gap-2" [disabled]="loading">
                  <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!loading" class="bi bi-box-arrow-in-right"></i>
                  <span>Sign In</span>
                </button>
              </form>

              <hr class="my-3" style="border-color:#e2e8f0;" />
              <div class="text-center text-muted small">
                Don't have a citizen account?
                <a routerLink="/register" class="text-primary fw-semibold text-decoration-none ms-1">Create Account →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-indigo {
      background-color: #4f46e5;
      color: #ffffff;
      border: none;
    }
    .btn-indigo:hover {
      background-color: #4338ca;
      color: #ffffff;
    }
  `]
})
export class LoginComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  quickLogin(email: string, pass: string): void {
    this.email = email;
    this.password = pass;
    this.onLogin();
  }

  onLogin(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMessage = '';

    this.apiService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        const token = res.token;
        const user = res.user;

        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId
        }));

        if (user.role === 'CITIZEN') {
          this.router.navigate(['/my-complaints']);
        } else if (user.role === 'OFFICER') {
          this.router.navigate(['/officer/dashboard']);
        } else if (user.role === 'DEPT_HEAD') {
          this.router.navigate(['/dept-head/dashboard']);
        } else if (user.role === 'SUPER_ADMIN') {
          this.router.navigate(['/admin/analytics']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid email or password';
      }
    });
  }
}
