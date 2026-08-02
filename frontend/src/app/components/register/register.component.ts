import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border-0 shadow-lg rounded-4 overflow-hidden bg-white border">

            <!-- Header -->
            <div class="card-header bg-white text-center p-4 border-bottom">
              <div class="d-inline-flex align-items-center justify-content-center text-white rounded-circle mb-2 shadow-sm" style="width:52px;height:52px;font-size:1.4rem;background:linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);">
                <i class="bi bi-person-plus-fill"></i>
              </div>
              <h3 class="fw-bold mb-1 tracking-tight text-dark">Citizen Registration</h3>
              <p class="text-muted small mb-0">Create an account to submit and track public grievances</p>
            </div>

            <div class="card-body p-4 bg-white">
              <!-- Success Alert -->
              <div *ngIf="success()" class="alert alert-success rounded-3 p-3.5 mb-3 d-flex align-items-center gap-3">
                <i class="bi bi-check-circle-fill fs-3 text-success"></i>
                <div>
                  <div class="fw-bold text-dark">Account Created Successfully</div>
                  <div class="small text-muted">Redirecting to sign in...</div>
                </div>
              </div>

              <form *ngIf="!success()" (ngSubmit)="onRegister()">
                <div class="mb-3">
                  <label class="form-label fw-medium text-dark small text-uppercase">Full Name</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0 text-muted d-flex align-items-center justify-content-center px-3"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control form-control-lg rounded-end-3 border-start-0 fs-6"
                           [(ngModel)]="name" name="name"
                           placeholder="Rajesh Kumar"
                           required />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-medium text-dark small text-uppercase">Email Address</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0 text-muted d-flex align-items-center justify-content-center px-3"><i class="bi bi-envelope"></i></span>
                    <input type="email" class="form-control form-control-lg rounded-end-3 border-start-0 fs-6"
                           [(ngModel)]="email" name="email"
                           placeholder="you@example.com"
                           required />
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label fw-medium text-dark small text-uppercase">Password</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0 text-muted d-flex align-items-center justify-content-center px-3"><i class="bi bi-key"></i></span>
                    <input type="password" class="form-control form-control-lg rounded-end-3 border-start-0 fs-6"
                           [(ngModel)]="password" name="password"
                           placeholder="Minimum 6 characters"
                           required minlength="6" />
                  </div>
                  <div class="form-text text-muted small mt-1">Must be at least 6 characters long</div>
                </div>

                <div *ngIf="errorMessage" class="alert alert-danger rounded-3 py-2.5 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <span>{{ errorMessage }}</span>
                </div>

                <button type="submit" class="btn btn-indigo btn-lg w-100 rounded-3 fw-bold shadow-sm d-inline-flex align-items-center justify-content-center gap-2"
                        [disabled]="loading()">
                  <span *ngIf="loading()" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!loading()" class="bi bi-check-lg"></i>
                  <span>{{ loading() ? 'Creating Account...' : 'Register Account' }}</span>
                </button>
              </form>

              <hr class="my-4" style="border-color:#e2e8f0;" />
              <div class="text-center text-muted small">
                Already registered?
                <a routerLink="/login" class="text-primary fw-semibold text-decoration-none ms-1">Sign In →</a>
              </div>

              <div class="mt-4 p-3 bg-light rounded-3 border small text-muted">
                <div class="fw-semibold text-dark mb-1.5 d-flex align-items-center gap-1.5">
                  <i class="bi bi-info-circle-fill text-indigo"></i>
                  <span>Account Governance Structure</span>
                </div>
                <ul class="mb-0 ps-3">
                  <li><strong>Citizens</strong>: Self-register above for public grievance filing.</li>
                  <li><strong>Officers</strong>: Created by their respective Department Head.</li>
                  <li><strong>Dept Heads</strong>: Provisioned by the Super Administrator.</li>
                </ul>
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
    .text-indigo { color: #4f46e5; }
  `]
})
export class RegisterComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  errorMessage = '';

  loading = signal(false);
  success = signal(false);

  onRegister(): void {
    if (!this.name || !this.email || !this.password) return;
    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    this.loading.set(true);
    this.errorMessage = '';

    this.api.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage = err.error?.message || 'Registration failed. Email may already be in use.';
      }
    });
  }
}
