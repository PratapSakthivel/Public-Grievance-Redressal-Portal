import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Complaint } from '../../models/complaint.model';
import { ComplaintCardComponent } from '../../shared/complaint-card/complaint-card.component';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ComplaintCardComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-title">👤 My Dashboard</h1>
            <p class="page-subtitle">Welcome back, <strong>{{ user?.name }}</strong> — here are your filed complaints.</p>
          </div>
          <a routerLink="/file-complaint" class="btn btn-primary">+ File New Complaint</a>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-4 mb-6">
        <div class="stat-card primary">
          <div class="stat-icon">📋</div>
          <div class="stat-value">{{ complaints.length }}</div>
          <div class="stat-label">Total Filed</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ byStatus('RESOLVED') }}</div>
          <div class="stat-label">Resolved</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">{{ byStatus('IN_PROGRESS') + byStatus('ASSIGNED') }}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">📮</div>
          <div class="stat-value">{{ byStatus('FILED') }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>

      <!-- Complaints Grid -->
      @if (loading) {
        <div class="spinner"></div>
      } @else if (complaints.length === 0) {
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>No Complaints Filed Yet</h3>
          <p>Start by filing your first complaint</p>
          <a routerLink="/file-complaint" class="btn btn-primary mt-4">File a Complaint</a>
        </div>
      } @else {
        <div class="grid grid-complaints">
          <app-complaint-card *ngFor="let c of complaints" [complaint]="c"></app-complaint-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .grid-complaints { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
    @media(max-width: 640px) { .grid-complaints { grid-template-columns: 1fr; } }
  `]
})
export class CitizenDashboardComponent implements OnInit {
  complaints: Complaint[] = [];
  loading = true;
  get user() { return this.authService.currentUser; }

  constructor(private complaintService: ComplaintService, private authService: AuthService) {}

  ngOnInit() {
    this.complaintService.getMyComplaints().subscribe({
      next: (data) => { this.complaints = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  byStatus(status: string) {
    return this.complaints.filter(c => c.status === status).length;
  }
}
