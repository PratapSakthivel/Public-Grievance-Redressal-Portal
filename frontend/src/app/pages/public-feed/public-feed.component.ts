import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../services/complaint.service';
import { Complaint } from '../../models/complaint.model';
import { ComplaintCardComponent } from '../../shared/complaint-card/complaint-card.component';

@Component({
  selector: 'app-public-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ComplaintCardComponent],
  template: `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">🇮🇳 Public Grievance Portal</div>
        <h1>Your Voice, <span class="gradient-text">Amplified</span></h1>
        <p class="hero-sub">File complaints, track resolution, and hold departments accountable — all in one transparent platform.</p>
        <div class="hero-cta">
          <a routerLink="/register" class="btn btn-primary btn-lg">Get Started Free</a>
          <a routerLink="/public" class="btn btn-secondary btn-lg">View Public Complaints</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><strong>{{ complaints.length }}</strong><span>Complaints Filed</span></div>
          <div class="hero-stat"><strong>{{ resolvedCount }}</strong><span>Resolved</span></div>
          <div class="hero-stat"><strong>{{ departments }}</strong><span>Departments</span></div>
        </div>
      </div>
    </section>

    <div class="page-wrapper">
      <!-- Filters -->
      <div class="filters card mb-6">
        <div class="filter-row">
          <div class="form-group mb-0 flex-1">
            <input class="form-control" placeholder="🔍 Search complaints..." [(ngModel)]="searchText" (ngModelChange)="applyFilter()">
          </div>
          <div class="form-group mb-0">
            <select class="form-control" [(ngModel)]="filterStatus" (change)="applyFilter()">
              <option value="">All Statuses</option>
              <option value="FILED">Filed</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <select class="form-control" [(ngModel)]="filterCategory" (change)="applyFilter()">
              <option value="">All Categories</option>
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Content -->
      @if (loading) {
        <div class="spinner"></div>
      } @else if (filtered.length === 0) {
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>No complaints found</h3>
          <p>Be the first to raise an issue in your area.</p>
          <a routerLink="/register" class="btn btn-primary mt-4">File a Complaint</a>
        </div>
      } @else {
        <div class="grid grid-complaints">
          <app-complaint-card *ngFor="let c of filtered" [complaint]="c"></app-complaint-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .hero {
      background: radial-gradient(ellipse at top, rgba(99,102,241,0.12) 0%, transparent 60%), var(--bg);
      border-bottom: 1px solid rgba(99,102,241,0.1);
      padding: 5rem 1.5rem 3rem;
    }
    .hero-inner { max-width: 900px; margin: 0 auto; text-align: center; }
    .hero-badge {
      display: inline-block;
      background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
      padding: 0.35rem 1rem; border-radius: 100px;
      font-size: 0.875rem; font-weight: 600; color: #a5b4fc;
      margin-bottom: 1.5rem;
    }
    h1 { font-size: 3.5rem; font-weight: 900; margin-bottom: 1rem; line-height: 1.2; }
    .hero-sub { font-size: 1.125rem; color: #94a3b8; max-width: 600px; margin: 0 auto 2rem; }
    .hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem; }
    .hero-stats { display: flex; gap: 3rem; justify-content: center; flex-wrap: wrap; }
    .hero-stat { display: flex; flex-direction: column; align-items: center; }
    .hero-stat strong { font-size: 2.25rem; font-weight: 800; color: #a5b4fc; }
    .hero-stat span { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
    .filters { padding: 1.25rem; }
    .filter-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .filter-row .form-group { min-width: 160px; }
    .grid-complaints { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); }
    @media(max-width: 640px) {
      h1 { font-size: 2rem; }
      .grid-complaints { grid-template-columns: 1fr; }
    }
  `]
})
export class PublicFeedComponent implements OnInit {
  complaints: Complaint[] = [];
  filtered: Complaint[] = [];
  loading = true;
  searchText = '';
  filterStatus = '';
  filterCategory = '';
  categories: string[] = [];
  departments = 8;

  get resolvedCount() {
    return this.complaints.filter(c => c.status === 'RESOLVED').length;
  }

  constructor(private complaintService: ComplaintService) {}

  ngOnInit() {
    this.complaintService.getPublicFeed().subscribe({
      next: (data) => {
        this.complaints = data;
        this.filtered = data;
        this.categories = [...new Set(data.map(c => c.category))];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    this.filtered = this.complaints.filter(c => {
      const matchText = !this.searchText ||
        c.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
        c.description.toLowerCase().includes(this.searchText.toLowerCase()) ||
        c.areaName?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchStatus = !this.filterStatus || c.status === this.filterStatus;
      const matchCategory = !this.filterCategory || c.category === this.filterCategory;
      return matchText && matchStatus && matchCategory;
    });
  }
}
