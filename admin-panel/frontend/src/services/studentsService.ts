import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { Student } from '../types';

export interface StudentFilters {
  collegeId?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const studentsService = {
  async getStudents(filters?: StudentFilters): Promise<ApiResponse<Student[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getStudents();
    }
    return apiClient.get<Student[]>('/students', filters as Record<string, string | number>);
  },

  async getStudentById(id: string): Promise<ApiResponse<Student>> {
    if (apiClient.isDemoMode()) {
      const all = await mockAdapter.getStudents();
      const s = all.data.find((student) => student.id === id);
      if (!s) throw new Error('Student not found');
      return { success: true, data: s };
    }
    return apiClient.get<Student>(`/students/${id}`);
  },

  async addStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<ApiResponse<Student>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.addStudent(studentData);
    }
    return apiClient.post<Student>('/students', studentData);
  },

  async revokeStudentAccess(studentId: string, reason: string): Promise<ApiResponse<Student>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.revokeStudentAccess(studentId, reason);
    }
    return apiClient.post<Student>(`/students/${studentId}/revoke`, { reason });
  },

  async reactivateStudentAccess(studentId: string): Promise<ApiResponse<Student>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.reactivateStudentAccess(studentId);
    }
    return apiClient.post<Student>(`/students/${studentId}/reactivate`);
  },
};
