import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, PublicComplaint } from '../../services/api.service';

@Component({
  selector: 'app-file-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card border-0 shadow-lg rounded-4 overflow-hidden bg-white border">
            <!-- Header -->
            <div class="card-header bg-white text-center p-4 border-bottom">
              <div class="d-inline-flex align-items-center justify-content-center text-white rounded-circle mb-2 shadow-sm" style="width:52px;height:52px;font-size:1.4rem;background:linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);">
                <i class="bi bi-file-earmark-plus-fill"></i>
              </div>
              <h3 class="fw-bold mb-1 tracking-tight text-dark">Submit Public Grievance</h3>
              <p class="text-muted small mb-0">File an official grievance with automated duplicate detection</p>
            </div>

            <div class="card-body p-4 bg-white">
              <!-- Success Banner -->
              <div *ngIf="successMsg()" class="alert alert-success rounded-3 p-4 mb-4 d-flex align-items-center gap-3">
                <i class="bi bi-check-circle-fill fs-2 text-success"></i>
                <div>
                  <h5 class="fw-bold mb-1 text-dark">Grievance Submitted Successfully!</h5>
                  <p class="mb-0 small text-muted">Tracking ID: <span class="font-monospace fw-bold text-dark">{{ createdId() }}</span>. Redirecting to your grievances...</p>
                </div>
              </div>

              <form *ngIf="!successMsg()" (ngSubmit)="onSubmit()">
                <!-- Grievance Title -->
                <div class="mb-3">
                  <label class="form-label text-dark font-weight-medium small text-uppercase mb-1.5">Grievance Title</label>
                  <input type="text" class="form-control form-control-lg rounded-3 fs-6"
                         [(ngModel)]="title" name="title"
                         placeholder="e.g. Water Main Pipe Burst on 4th Main Road"
                         required />
                </div>

                <!-- Category & Pincode -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label text-dark font-weight-medium small text-uppercase mb-1.5">Department Category</label>
                    <select class="form-select form-select-lg rounded-3 fs-6"
                            [(ngModel)]="category" name="category"
                            (change)="onCategoryOrPincodeChange()"
                            required>
                      <option value="">-- Select Category --</option>
                      <option value="WATER">Water Supply & Drainage</option>
                      <option value="ROADS">Roads & Infrastructure</option>
                      <option value="ELECTRICITY">Electricity & Power</option>
                      <option value="SANITATION">Sanitation & Garbage</option>
                      <option value="PUBLIC_HEALTH">Public Health & Hygiene</option>
                      <option value="OTHER">Other Grievances</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label text-dark font-weight-medium small text-uppercase mb-1.5">Pincode</label>
                    <input type="text" class="form-control form-control-lg rounded-3 fs-6"
                           [(ngModel)]="pincode" name="pincode"
                           (keyup)="onCategoryOrPincodeChange()"
                           placeholder="6-digit pincode e.g. 600001"
                           required maxLength="6" />
                  </div>
                </div>

                <!-- Area Name -->
                <div class="mb-3">
                  <label class="form-label text-dark font-weight-medium small text-uppercase mb-1.5">Area / Locality Name</label>
                  <input type="text" class="form-control form-control-lg rounded-3 fs-6"
                         [(ngModel)]="areaName" name="areaName"
                         placeholder="e.g. Anna Nagar, Block B" />
                </div>

                <!-- Priority Selection -->
                <div class="mb-3">
                  <label class="form-label text-dark font-weight-medium small text-uppercase mb-1.5">Urgency Priority</label>
                  <select class="form-select rounded-3 fs-6" [(ngModel)]="priority" name="priority">
                    <option value="MEDIUM">Medium Priority (Standard response)</option>
                    <option value="HIGH">High Priority (Urgent hazard / outage)</option>
                    <option value="LOW">Low Priority (General inquiry / maintenance)</option>
                  </select>
                </div>

                <!-- Description -->
                <div class="mb-4">
                  <label class="form-label text-dark font-weight-medium small text-uppercase mb-1.5">Detailed Description</label>
                  <textarea class="form-control rounded-3 fs-6" rows="4"
                            [(ngModel)]="description" name="description"
                            placeholder="Provide exact details regarding the location, severity, and impact..."
                            required></textarea>
                </div>

                <!-- Duplicate Warning Alert Box -->
                <div *ngIf="checkingDuplicates()" class="alert alert-info py-2 px-3 small rounded-3 mb-4 d-flex align-items-center gap-2">
                  <div class="spinner-border spinner-border-sm text-info"></div>
                  <span>Checking for similar open grievances in pincode {{ pincode }}...</span>
                </div>

                <div *ngIf="duplicates().length > 0" class="card border-warning bg-warning-subtle rounded-3 p-3.5 mb-4">
                  <div class="d-flex align-items-center gap-2 mb-2 text-warning-emphasis">
                    <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                    <h6 class="fw-bold mb-0">Similar Open Grievances Found in Your Area</h6>
                  </div>
                  <p class="small mb-2 text-dark">To prevent duplicate tickets, you can upvote an existing issue below instead of filing a new one:</p>
                  <div class="list-group list-group-flush rounded-3">
                    <div *ngFor="let dup of duplicates()" class="list-group-item bg-white d-flex justify-content-between align-items-center py-2.5 px-3 border rounded-2 mb-1">
                      <div>
                        <div class="fw-semibold small text-dark">{{ dup.title }}</div>
                        <div class="text-muted font-monospace" style="font-size:0.75rem">📍 {{ dup.areaName || dup.pincode }} • Status: {{ dup.status }}</div>
                      </div>
                      <a [routerLink]="['/complaints', dup.id]" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold">
                        Upvote Existing →
                      </a>
                    </div>
                  </div>
                </div>

                <div *ngIf="errorMessage()" class="alert alert-danger rounded-3 py-2.5 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i class="bi bi-exclamation-octagon-fill"></i>
                  <span>{{ errorMessage() }}</span>
                </div>

                <button type="submit" class="btn btn-indigo btn-lg w-100 rounded-3 fw-bold shadow-sm d-inline-flex align-items-center justify-content-center gap-2"
                        [disabled]="submitting()">
                  <span *ngIf="submitting()" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!submitting()" class="bi bi-send-fill"></i>
                  <span>{{ submitting() ? 'Submitting Grievance...' : 'Submit Official Grievance' }}</span>
                </button>
              </form>
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
export class FileComplaintComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  title = '';
  category = '';
  pincode = '';
  areaName = '';
  priority = 'MEDIUM';
  description = '';

  submitting = signal(false);
  checkingDuplicates = signal(false);
  duplicates = signal<PublicComplaint[]>([]);
  errorMessage = signal('');
  successMsg = signal(false);
  createdId = signal('');

  onCategoryOrPincodeChange(): void {
    if (this.category && this.pincode && this.pincode.length === 6) {
      this.checkingDuplicates.set(true);
      this.api.checkDuplicates(this.category, this.pincode).subscribe({
        next: (dups) => {
          this.duplicates.set(dups || []);
          this.checkingDuplicates.set(false);
        },
        error: () => this.checkingDuplicates.set(false)
      });
    } else {
      this.duplicates.set([]);
    }
  }

  onSubmit(): void {
    if (!this.title || !this.category || !this.pincode || !this.description) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set('');

    const payload = {
      title: this.title,
      category: this.category,
      pincode: this.pincode,
      areaName: this.areaName,
      priority: this.priority,
      description: this.description
    };

    this.api.fileComplaint(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.successMsg.set(true);
        this.createdId.set(res.id);
        setTimeout(() => this.router.navigate(['/my-complaints']), 2500);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit complaint. Please check authentication.');
      }
    });
  }
}
