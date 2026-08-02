import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card-glass">
        <div class="auth-logo">🏛️</div>
        <h2 class="auth-title">Create Account</h2>
        <p class="auth-sub">Join thousands of citizens making their voice heard</p>

        @if (error) {
          <div class="alert alert-error">⚠️ {{ error }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-control" formControlName="name" placeholder="Your full name">
            @if (form.get('name')?.touched && form.get('name')?.invalid) {
              <span class="form-error">Name is required (min 2 characters)</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input class="form-control" type="email" formControlName="email" placeholder="you@example.com">
            @if (form.get('email')?.touched && form.get('email')?.invalid) {
              <span class="form-error">Valid email is required</span>
            }
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" formControlName="password" placeholder="Minimum 6 characters">
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <span class="form-error">Password must be at least 6 characters</span>
            }
          </div>
          <button class="btn btn-primary btn-full btn-lg" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <p class="auth-footer">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
      background: radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 70%);
    }
    .auth-card { width: 100%; max-width: 440px; }
    .auth-logo { text-align: center; font-size: 3rem; margin-bottom: 0.5rem; }
    .auth-title { text-align: center; font-size: 1.75rem; margin-bottom: 0.375rem; }
    .auth-sub { text-align: center; color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.75rem; }
    .auth-footer { text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: #94a3b8; }
  `]
})
export class RegisterComponent {
  form: ReturnType<FormBuilder['group']>;
  error: string | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const { name, email, password } = this.form.value;
    this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (err) => { this.loading = false; this.error = err.error?.message || 'Registration failed. Try again.'; }
    });
  }
}
