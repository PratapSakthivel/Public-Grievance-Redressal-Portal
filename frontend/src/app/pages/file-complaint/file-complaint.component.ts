import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { Complaint } from '../../models/complaint.model';

const CATEGORIES = [
  'Roads & Infrastructure', 'Water Supply', 'Electricity', 'Sanitation',
  'Public Health', 'Environment', 'Public Safety', 'Education', 'Transport', 'Other'
];

@Component({
  selector: 'app-file-complaint',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        <h1 class="page-title mt-2">📝 File a Complaint</h1>
        <p class="page-subtitle">Describe your issue clearly to help the concerned department resolve it faster.</p>
      </div>

      <div class="form-layout">
        <div class="card form-card">
          @if (error) { <div class="alert alert-error mb-4">⚠️ {{ error }}</div> }
          @if (success) { <div class="alert alert-success mb-4">✅ {{ success }}</div> }

          <!-- Similar complaints warning -->
          @if (similar.length > 0) {
            <div class="alert alert-info mb-4">
              ⚠️ There are <strong>{{ similar.length }}</strong> similar open complaints in your area. Consider upvoting them instead!
              <div class="similar-links mt-2">
                <a *ngFor="let s of similar" [routerLink]="['/complaints', s.id]" class="similar-link">
                  → {{ s.title | slice:0:60 }}
                </a>
              </div>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Complaint Title *</label>
              <input class="form-control" formControlName="title" placeholder="Short, descriptive title (e.g. Broken streetlight on MG Road)">
            </div>

            <div class="form-group">
              <label class="form-label">Description *</label>
              <textarea class="form-control" formControlName="description" rows="5"
                placeholder="Provide full details about the issue — location, duration, severity etc."></textarea>
            </div>

            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-control" formControlName="category" (change)="onCategoryChange()">
                  <option value="">Select Category</option>
                  <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Department *</label>
                <select class="form-control" formControlName="departmentId">
                  <option value="">Select Department</option>
                  <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">Pincode *</label>
                <input class="form-control" formControlName="pincode" placeholder="e.g. 560001" maxlength="6" (blur)="onPincodeBlur()">
              </div>
              <div class="form-group">
                <label class="form-label">Area / Locality</label>
                <input class="form-control" formControlName="areaName" placeholder="e.g. Koramangala Block 5">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Priority</label>
              <div class="priority-options">
                <label *ngFor="let p of priorities" class="priority-option" [class.selected]="form.get('priority')?.value === p.value">
                  <input type="radio" formControlName="priority" [value]="p.value">
                  <span class="priority-icon">{{ p.icon }}</span>
                  <span class="priority-label">{{ p.label }}</span>
                </label>
              </div>
            </div>

            <button class="btn btn-primary btn-full btn-lg" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Submitting...' : '🚀 Submit Complaint' }}
            </button>
          </form>
        </div>

        <aside class="form-tips card-glass">
          <h4>💡 Tips for a Good Complaint</h4>
          <ul class="tips-list">
            <li>Be specific about the location (street name, landmark)</li>
            <li>Mention how long the issue has been present</li>
            <li>Describe the impact on residents / community</li>
            <li>Choose the most relevant department</li>
            <li>High priority complaints get escalated faster</li>
          </ul>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .back-link { color: var(--text-muted); font-size: 0.875rem; text-decoration: none; }
    .back-link:hover { color: var(--primary-light); }
    .form-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }
    .form-card { }
    .priority-options { display: flex; gap: 0.75rem; }
    .priority-option {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
      padding: 0.75rem; border-radius: 10px; border: 2px solid var(--border-subtle);
      cursor: pointer; transition: all 0.2s;
    }
    .priority-option:hover, .priority-option.selected {
      border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.08);
    }
    .priority-option input { display: none; }
    .priority-icon { font-size: 1.5rem; }
    .priority-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
    .form-tips { padding: 1.5rem; }
    .form-tips h4 { margin-bottom: 1rem; }
    .tips-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
    .tips-list li { font-size: 0.875rem; color: var(--text-muted); padding-left: 1.25rem; position: relative; }
    .tips-list li::before { content: '✓'; position: absolute; left: 0; color: var(--success); font-weight: 700; }
    .similar-links { display: flex; flex-direction: column; gap: 0.35rem; }
    .similar-link { font-size: 0.825rem; color: #a5b4fc; text-decoration: none; }
    .similar-link:hover { text-decoration: underline; }
    @media(max-width: 768px) { .form-layout { grid-template-columns: 1fr; } .priority-options { flex-wrap: wrap; } }
  `]
})
export class FileComplaintComponent implements OnInit {
  categories = CATEGORIES;
  departments: Department[] = [];
  similar: Complaint[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  priorities = [
    { value: 'LOW', label: 'Low', icon: '🟢' },
    { value: 'MEDIUM', label: 'Medium', icon: '🟡' },
    { value: 'HIGH', label: 'High', icon: '🔴' }
  ];

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private complaintService: ComplaintService,
    private departmentService: DepartmentService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(30)]],
      category: ['', Validators.required],
      departmentId: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      areaName: [''],
      priority: ['MEDIUM']
    });
  }

  ngOnInit() {
    this.departmentService.getAllDepartments().subscribe(d => this.departments = d);
  }

  onCategoryChange() { this.checkSimilar(); }
  onPincodeBlur() { this.checkSimilar(); }

  checkSimilar() {
    const cat = this.form.get('category')?.value;
    const pin = this.form.get('pincode')?.value;
    if (cat && pin && pin.length === 6) {
      this.complaintService.getSimilarComplaints(cat, pin).subscribe(list => this.similar = list.slice(0, 3));
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const val = this.form.value;
    this.complaintService.fileComplaint({
      title: val.title!,
      description: val.description!,
      category: val.category!,
      departmentId: Number(val.departmentId),
      pincode: val.pincode!,
      areaName: val.areaName || undefined,
      priority: val.priority || 'MEDIUM'
    }).subscribe({
      next: (c) => {
        this.loading = false;
        this.success = 'Complaint filed successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/complaints', c.id]), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to file complaint. Please try again.';
      }
    });
  }
}
