import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ApiService, PublicComplaint } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-public-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Hero Banner -->
      <div class="feed-hero rounded-4 shadow-sm mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 p-4 p-md-5">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <h1 class="h3 fw-bold mb-0 text-white">Public Transparency Feed</h1>
            <span class="live-badge ms-2">
              <span class="pulse-dot"></span> LIVE
            </span>
          </div>
          <p class="text-white mb-0" style="opacity:0.85; font-size:0.9rem;">
            Track community grievances, upvote issues in your area, and monitor official resolution progress.
          </p>
        </div>
        <a routerLink="/file-complaint" class="btn btn-light rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2" style="color:#4f46e5;">
          <i class="bi bi-plus-circle-fill"></i>
          <span>File Grievance</span>
        </a>
      </div>

      <!-- Filter Row -->
      <div class="card border-0 shadow-sm rounded-4 mb-4 p-3 bg-white">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">
              <i class="bi bi-grid-fill me-1" style="color:#4f46e5;"></i>Category
            </label>
            <select class="form-select" [(ngModel)]="selectedCategory" (change)="loadFeed()">
              <option value="">All Categories</option>
              <option value="WATER">Water Supply</option>
              <option value="ROADS">Roads & Infrastructure</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="SANITATION">Sanitation</option>
              <option value="PUBLIC_HEALTH">Public Health</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">
              <i class="bi bi-geo-alt-fill me-1" style="color:#4f46e5;"></i>Pincode
            </label>
            <input type="text" class="form-control" placeholder="e.g. 600001"
              [(ngModel)]="selectedPincode" (keyup.enter)="loadFeed()" />
          </div>
          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-primary rounded-pill flex-fill fw-semibold d-inline-flex align-items-center justify-content-center gap-2"
              style="background:#4f46e5; border-color:#4f46e5;" (click)="loadFeed()">
              <i class="bi bi-funnel-fill"></i>
              <span>Filter</span>
            </button>
            <button class="btn btn-outline-secondary rounded-pill px-3 d-inline-flex align-items-center gap-1" (click)="resetFilters()">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Not logged in notice for upvoting -->
      <div *ngIf="!isLoggedIn()" class="alert d-flex align-items-center gap-2 mb-4 rounded-3"
        style="background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
        <i class="bi bi-info-circle-fill"></i>
        <span><a routerLink="/login" style="color:#4f46e5; font-weight:600;">Sign in</a> as a Citizen to upvote issues in your community.</span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border" role="status" style="width:2.5rem;height:2.5rem;color:#4f46e5;"></div>
        <p class="mt-3 text-muted small fw-medium">Loading transparency feed...</p>
      </div>

      <!-- Feed Grid -->
      <div *ngIf="!loading()" class="row g-4">
        <div *ngIf="complaints().length === 0" class="col-12 text-center py-5 bg-white rounded-4 border">
          <i class="bi bi-inbox fs-1 d-block mb-2 text-muted"></i>
          <p class="mb-0 text-muted">No public grievances match your filters.</p>
        </div>

        <div *ngFor="let item of complaints()" class="col-md-6 col-lg-4">
          <div class="complaint-card h-100">
            <div class="card-inner">
              <!-- Top: Category + Status -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="cat-badge">
                  <i [class]="getCategoryIcon(item.category)"></i>
                  {{ formatCategory(item.category) }}
                </span>
                <span class="badge badge-status" [ngClass]="getStatusClass(item.status)">
                  {{ item.status.replace('_', ' ') }}
                </span>
              </div>

              <!-- Title -->
              <h5 class="complaint-title">{{ item.title }}</h5>

              <!-- Location -->
              <p class="location-tag">
                <i class="bi bi-geo-alt-fill text-danger"></i>
                {{ item.areaName ? item.areaName + ', ' : '' }}{{ item.pincode }}
              </p>

              <!-- Footer: Date + Upvote + View -->
              <div class="card-footer-row">
                <span class="date-tag">{{ item.createdAt | date:'d MMM y' }}</span>

                <div class="d-flex align-items-center gap-2">
                  <!-- Upvote Button: only for logged-in citizens -->
                  <button
                    *ngIf="isCitizen()"
                    class="upvote-btn"
                    [class.upvoted]="upvotedIds().has(item.id)"
                    [disabled]="upvotingIds().has(item.id)"
                    (click)="toggleUpvote(item); $event.stopPropagation()"
                    [title]="upvotedIds().has(item.id) ? 'Remove upvote' : 'Upvote this issue'"
                  >
                    <i [class]="upvotedIds().has(item.id) ? 'bi bi-hand-thumbs-up-fill' : 'bi bi-hand-thumbs-up'"></i>
                    <span>{{ item.upvoteCount }}</span>
                  </button>

                  <!-- Static upvote count if not citizen -->
                  <span *ngIf="!isCitizen()" class="upvote-count-badge">
                    <i class="bi bi-hand-thumbs-up-fill"></i>
                    {{ item.upvoteCount }}
                  </span>

                  <!-- View detail link -->
                  <a [routerLink]="['/complaints', item.id]" class="view-btn">
                    View <i class="bi bi-arrow-right-short"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error toast -->
      <div *ngIf="errorMsg()" class="toast-error">
        <i class="bi bi-exclamation-circle-fill"></i>
        {{ errorMsg() }}
      </div>
    </div>
  `,
  styles: [`
    /* Hero */
    .feed-hero {
      background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
    }

    /* Live Badge */
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
    }
    .pulse-dot {
      width: 7px; height: 7px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
      display: inline-block;
    }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.7); }
      70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }

    /* Complaint Card */
    .complaint-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      overflow: hidden;
    }
    .complaint-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.07);
    }
    .card-inner {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Category Badge */
    .cat-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 3px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Title */
    .complaint-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.4;
      margin-bottom: 0.5rem;
      flex: 1;
    }

    /* Location */
    .location-tag {
      font-size: 0.8rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 0.75rem;
    }

    /* Card Footer */
    .card-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      margin-top: auto;
      gap: 8px;
    }
    .date-tag {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Upvote Button */
    .upvote-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 99px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .upvote-btn:hover:not(:disabled) {
      background: #eef2ff;
      border-color: #a5b4fc;
      color: #4f46e5;
    }
    .upvote-btn.upvoted {
      background: #eef2ff;
      border-color: #4f46e5;
      color: #4f46e5;
    }
    .upvote-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Static upvote count (non-citizen) */
    .upvote-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
    }

    /* View Button */
    .view-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 5px 12px;
      border-radius: 99px;
      border: 1px solid #c7d2fe;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .view-btn:hover {
      background: #4f46e5;
      color: #fff;
      border-color: #4f46e5;
    }

    /* Error Toast */
    .toast-error {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 10px 20px;
      border-radius: 99px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
  `]
})
export class PublicFeedComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);

  complaints = signal<PublicComplaint[]>([]);
  loading = signal<boolean>(true);
  upvotedIds = signal<Set<string>>(new Set());     // IDs the current user has upvoted
  upvotingIds = signal<Set<string>>(new Set());    // IDs currently being upvoted (pending)
  errorMsg = signal<string>('');

  selectedCategory = '';
  selectedPincode = '';

  private feedChannel: RealtimeChannel | null = null;
  private errorTimer: any;

  ngOnInit(): void {
    this.loadFeed();
    this.initRealtimeFeed();
  }

  ngOnDestroy(): void {
    if (this.feedChannel) {
      this.supabaseService.unsubscribe(this.feedChannel);
    }
    if (this.errorTimer) clearTimeout(this.errorTimer);
  }

  isLoggedIn(): boolean {
    return this.apiService.isLoggedIn();
  }

  isCitizen(): boolean {
    return this.apiService.getCurrentUser()?.role === 'CITIZEN';
  }

  loadFeed(): void {
    this.loading.set(true);
    this.apiService.getPublicFeed(this.selectedCategory, this.selectedPincode).subscribe({
      next: (data) => {
        this.complaints.set(data.content || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedPincode = '';
    this.loadFeed();
  }

  toggleUpvote(item: PublicComplaint): void {
    if (!this.isCitizen()) {
      this.showError('Only citizens can upvote issues.');
      return;
    }

    const id = item.id;
    const already = this.upvotedIds().has(id);

    // Optimistic update
    const nextUpvoted = new Set(this.upvotedIds());
    if (already) {
      nextUpvoted.delete(id);
    } else {
      nextUpvoted.add(id);
    }
    this.upvotedIds.set(nextUpvoted);

    // Mark as in-flight
    const nextUpvoting = new Set(this.upvotingIds());
    nextUpvoting.add(id);
    this.upvotingIds.set(nextUpvoting);

    // Optimistically update count in list
    this.complaints.update(list =>
      list.map(c => c.id === id
        ? { ...c, upvoteCount: (c.upvoteCount || 0) + (already ? -1 : 1) }
        : c
      )
    );

    const req = already
      ? this.apiService.removeUpvote(id)
      : this.apiService.upvote(id);

    req.subscribe({
      next: (res: any) => {
        // Use the server-confirmed count
        this.complaints.update(list =>
          list.map(c => c.id === id
            ? { ...c, upvoteCount: res.upvoteCount ?? c.upvoteCount }
            : c
          )
        );
        const done = new Set(this.upvotingIds());
        done.delete(id);
        this.upvotingIds.set(done);
      },
      error: (err: any) => {
        // Roll back optimistic update
        const rollback = new Set(this.upvotedIds());
        if (already) rollback.add(id); else rollback.delete(id);
        this.upvotedIds.set(rollback);
        this.complaints.update(list =>
          list.map(c => c.id === id
            ? { ...c, upvoteCount: (c.upvoteCount || 0) + (already ? 1 : -1) }
            : c
          )
        );
        const done = new Set(this.upvotingIds());
        done.delete(id);
        this.upvotingIds.set(done);

        const msg = err?.error?.message || (already ? 'Could not remove upvote.' : 'Could not upvote. You may have already voted.');
        this.showError(msg);
      }
    });
  }

  private showError(msg: string): void {
    this.errorMsg.set(msg);
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => this.errorMsg.set(''), 3500);
  }

  private initRealtimeFeed(): void {
    this.feedChannel = this.supabaseService.subscribeToPublicFeed((payload) => {
      const currentList = this.complaints();
      if (payload.eventType === 'INSERT' && payload.new) {
        const newComplaint: PublicComplaint = {
          id: payload.new.id,
          title: payload.new.title,
          category: payload.new.category,
          pincode: payload.new.pincode,
          areaName: payload.new.area_name,
          status: payload.new.status,
          upvoteCount: payload.new.upvote_count || 0,
          createdAt: payload.new.created_at
        };
        this.complaints.set([newComplaint, ...currentList]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = currentList.map(item => {
          if (item.id === payload.new.id) {
            return { ...item, status: payload.new.status, upvoteCount: payload.new.upvote_count };
          }
          return item;
        });
        this.complaints.set(updated);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'FILED': return 'badge-filed';
      case 'ASSIGNED': return 'badge-assigned';
      case 'IN_PROGRESS': return 'badge-in_progress';
      case 'RESOLVED': return 'badge-resolved';
      case 'CLOSED': return 'badge-closed';
      case 'REOPENED': return 'badge-reopened';
      default: return 'bg-secondary';
    }
  }

  getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'WATER': return 'bi bi-droplet-fill text-primary';
      case 'ROADS': return 'bi bi-cone-striped text-warning';
      case 'ELECTRICITY': return 'bi bi-lightning-charge-fill text-warning';
      case 'SANITATION': return 'bi bi-trash-fill text-success';
      case 'PUBLIC_HEALTH': return 'bi bi-heart-pulse-fill text-danger';
      default: return 'bi bi-collection-fill text-secondary';
    }
  }

  formatCategory(cat: string): string {
    const map: Record<string, string> = {
      WATER: 'Water', ROADS: 'Roads', ELECTRICITY: 'Electricity',
      SANITATION: 'Sanitation', PUBLIC_HEALTH: 'Health', OTHER: 'Other'
    };
    return map[cat] || cat;
  }
}
