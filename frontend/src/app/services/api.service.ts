import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PublicComplaint {
  id: string;
  title: string;
  category: string;
  pincode: string;
  areaName?: string;
  status: string;
  upvoteCount: number;
  createdAt: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  oldStatus?: string;
  newStatus: string;
  remarks?: string;
  createdAt: string;
}

export interface ComplaintDto {
  id: string;
  citizenId: string;
  citizenName: string;
  departmentId?: string;
  departmentName?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  title: string;
  description: string;
  category: string;
  pincode: string;
  areaName?: string;
  status: string;
  priority: string;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintDetail {
  complaint: ComplaintDto;
  timeline: ComplaintUpdate[];
  hasUpvoted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  // Complaints
  getMyComplaints(): Observable<ComplaintDto[]> {
    return this.http.get<ComplaintDto[]>(`${this.baseUrl}/complaints/my`, {
      headers: this.getAuthHeaders()
    });
  }

  getAssignedComplaints(): Observable<ComplaintDto[]> {
    return this.http.get<ComplaintDto[]>(`${this.baseUrl}/complaints/assigned`, {
      headers: this.getAuthHeaders()
    });
  }

  getPublicFeed(category?: string, pincode?: string, status?: string, page = 0, size = 20): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (category) params = params.set('category', category);
    if (pincode) params = params.set('pincode', pincode);
    if (status) params = params.set('status', status);
    return this.http.get(`${this.baseUrl}/complaints/public`, { params });
  }

  getComplaintDetail(id: string): Observable<ComplaintDetail> {
    return this.http.get<ComplaintDetail>(`${this.baseUrl}/complaints/${id}/detail`, {
      headers: this.getAuthHeaders()
    });
  }

  fileComplaint(data: any): Observable<ComplaintDto> {
    return this.http.post<ComplaintDto>(`${this.baseUrl}/complaints`, data, {
      headers: this.getAuthHeaders()
    });
  }

  checkDuplicates(category: string, pincode: string): Observable<PublicComplaint[]> {
    const params = new HttpParams().set('category', category).set('pincode', pincode);
    return this.http.get<PublicComplaint[]>(`${this.baseUrl}/complaints/check-duplicates`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  upvote(complaintId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/complaints/${complaintId}/upvote`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  removeUpvote(complaintId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/complaints/${complaintId}/upvote`, {
      headers: this.getAuthHeaders()
    });
  }

  updateStatus(complaintId: string, newStatus: string, remarks?: string): Observable<ComplaintDto> {
    return this.http.patch<ComplaintDto>(`${this.baseUrl}/complaints/${complaintId}/status`, {
      newStatus,
      remarks
    }, {
      headers: this.getAuthHeaders()
    });
  }

  assignOfficer(complaintId: string, officerId: string): Observable<ComplaintDto> {
    return this.http.patch<ComplaintDto>(`${this.baseUrl}/complaints/${complaintId}/assign`, {
      officerId
    }, {
      headers: this.getAuthHeaders()
    });
  }

  getDepartmentComplaints(): Observable<ComplaintDto[]> {
    return this.http.get<ComplaintDto[]>(`${this.baseUrl}/complaints/department`, {
      headers: this.getAuthHeaders()
    });
  }

  getOfficers(departmentId?: string): Observable<any[]> {
    let params = new HttpParams().set('role', 'OFFICER');
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<any[]>(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/departments`, {
      headers: this.getAuthHeaders()
    });
  }

  createStaffUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, data, {
      headers: this.getAuthHeaders()
    });
  }

  createOfficer(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/officers`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getAllUsers(role?: string): Observable<any[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<any[]>(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  // Analytics DTOs
  getDepartmentAnalytics(departmentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/department/${departmentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getGlobalAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/global`, {
      headers: this.getAuthHeaders()
    });
  }

  // Auth Helpers
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
  }
}
