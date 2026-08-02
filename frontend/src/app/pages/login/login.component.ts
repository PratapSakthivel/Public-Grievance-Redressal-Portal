import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card-glass">
        <div class="auth-logo">⚖️</div>
        <h2 class="auth-title">Welcome Back</h2>
        <p class="auth-sub">Sign in to your grievance portal account</p>

        @if (error) {
          <div class="alert alert-error">⚠️ {{ error }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input class="form-control" type="email" formControlName="email" placeholder="you@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" formControlName="password" placeholder="Enter password">
          </div>
          <button class="btn btn-primary btn-full btn-lg" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="demo-logins">
          <p class="text-muted text-sm text-center mt-4 mb-2">Quick Demo Login:</p>
          <div class="demo-grid">
            <button class="demo-btn" (click)="demoLogin('admin@gov.in', 'password123')">Admin</button>
            <button class="demo-btn" (click)="demoLogin('dept.head@gov.in', 'password123')">Dept Head</button>
            <button class="demo-btn" (click)="demoLogin('officer1@gov.in', 'password123')">Officer</button>
            <button class="demo-btn" (click)="demoLogin('citizen1@gmail.com', 'password123')">Citizen</button>
          </div>
        </div>

        <p class="auth-footer">Don't have an account? <a routerLink="/register">Register here</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
      background: radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%);
    }
    .auth-card {
      width: 100%; max-width: 440px;
    }
    .auth-logo { text-align: center; font-size: 3rem; margin-bottom: 0.5rem; }
    .auth-title { text-align: center; font-size: 1.75rem; margin-bottom: 0.375rem; }
    .auth-sub { text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.75rem; }
    .auth-footer { text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: #94a3b8; }
    .demo-logins { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem; }
    .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .demo-btn {
      padding: 0.5rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600;
      border: 1px solid rgba(99,102,241,0.25); background: rgba(99,102,241,0.08);
      color: #a5b4fc; cursor: pointer; transition: all 0.2s;
    }
    .demo-btn:hover { background: rgba(99,102,241,0.2); }
  `]
})
export class LoginComponent {
  form: ReturnType<FormBuilder['group']>;
  error: string | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const { email, password } = this.form.value;
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        this.loading = false;
        this.redirectByRole(res.role);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid email or password.';
      }
    });
  }

  demoLogin(email: string, password: string) {
    this.form.setValue({ email, password });
    this.onSubmit();
  }

  private redirectByRole(role: string) {
    if (role === 'CITIZEN') this.router.navigate(['/dashboard']);
    else if (role === 'OFFICER' || role === 'DEPT_HEAD') this.router.navigate(['/officer-dashboard']);
    else if (role === 'SUPER_ADMIN') this.router.navigate(['/admin']);
    else this.router.navigate(['/public']);
  }
}
