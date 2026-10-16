/**
 * Students Management Service for BEXO College Panel
 * Handles student rosters, search, drilldown, single enrollments, updates, and bulk CSV/XLSX imports.
 * Server strictly scopes all queries and writes to the authenticated college.
 */

import { Student } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export interface StudentFilterParams {
  search?: string;
  department?: string;
  status?: string;
  batch?: string;
  page?: number;
  limit?: number;
}

export interface BulkImportStudentRow {
  name: string;
  rollNumber: string;
  email: string;
  department?: string;
  course?: string;
  batch?: string;
  phone?: string;
}

export interface BulkImportResponse {
  importedCount: number;
  skippedCount: number;
  errors: Array<{ rollNumber: string; reason: string }>;
}

export const studentsService = {
  /**
   * Fetch students belonging exclusively to the authenticated college.
   */
  async getStudents(params?: StudentFilterParams): Promise<Student[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getStudents(params);
    }
    const res = await apiClient.get<Student[]>('/college/students', params as Record<string, string | number>);
    return res.data;
  },

  /**
   * Fetch single student detail.
   * If student belongs to another institution, backend returns 403 Forbidden.
   */
  async getStudentById(id: string): Promise<Student> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getStudentById(id);
    }
    const res = await apiClient.get<Student>(`/college/students/${id}`);
    return res.data;
  },

  /**
   * Enroll a new student within the authenticated college.
   */
  async addStudent(
    studentData: Omit<Student, 'id' | 'collegeId' | 'collegeName' | 'createdAt' | 'lastActivityAt' | 'entitlementId' | 'resumeCount'> & {
      entitlementId?: string;
      resumeCount?: number;
    }
  ): Promise<Student> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.addStudent(studentData as any);
    }
    const res = await apiClient.post<Student>('/college/students', studentData);
    return res.data;
  },

  /**
   * Update student details.
   */
  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateStudent(id, updates);
    }
    const res = await apiClient.patch<Student>(`/college/students/${id}`, updates);
    return res.data;
  },

  /**
   * Revoke student access to platform services.
   */
  async revokeStudentAccess(id: string, reason: string): Promise<Student> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.revokeStudentAccess(id, reason);
    }
    const res = await apiClient.post<Student>(`/college/students/${id}/revoke`, { reason });
    return res.data;
  },

  /**
   * Reactivate previously revoked student access.
   */
  async reactivateStudentAccess(id: string): Promise<Student> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.reactivateStudentAccess(id);
    }
    const res = await apiClient.post<Student>(`/college/students/${id}/reactivate`);
    return res.data;
  },

  /**
   * Bulk import validated student roster.
   * Server validates duplicates within institution, records errors, and persists valid rows.
   */
  async bulkImportStudents(studentList: BulkImportStudentRow[]): Promise<BulkImportResponse> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.bulkImportStudents(studentList);
    }
    const res = await apiClient.post<BulkImportResponse>('/college/students/bulk-import', {
      students: studentList,
    });
    return res.data;
  },
};
