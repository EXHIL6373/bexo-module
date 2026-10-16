import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { AppTemplate } from '../types';

export const templatesService = {
  async getTemplates(): Promise<ApiResponse<AppTemplate[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getTemplates();
    }
    return apiClient.get<AppTemplate[]>('/templates');
  },

  async createTemplate(tmplData: Omit<AppTemplate, 'id' | 'createdAt' | 'updatedAt' | 'downloadsCount' | 'activeUsersCount'>): Promise<ApiResponse<AppTemplate>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.createTemplate(tmplData);
    }
    return apiClient.post<AppTemplate>('/templates', tmplData);
  },

  async updateTemplate(id: string, updates: Partial<AppTemplate>): Promise<ApiResponse<AppTemplate>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateTemplate(id, updates);
    }
    return apiClient.patch<AppTemplate>(`/templates/${id}`, updates);
  },

  async deleteTemplate(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.deleteTemplate(id);
    }
    return apiClient.delete<{ success: boolean }>(`/templates/${id}`);
  },

  async togglePublish(id: string): Promise<ApiResponse<AppTemplate>> {
    if (apiClient.isDemoMode()) {
      const res = await mockAdapter.getTemplates();
      const tmpl = res.data.find((t) => t.id === id);
      const newStatus = tmpl?.status === 'Published' ? 'Draft' : 'Published';
      return mockAdapter.updateTemplate(id, { status: newStatus });
    }
    return apiClient.post<AppTemplate>(`/templates/${id}/toggle-publish`);
  },

  async toggleFeatured(id: string): Promise<ApiResponse<AppTemplate>> {
    if (apiClient.isDemoMode()) {
      const res = await mockAdapter.getTemplates();
      const tmpl = res.data.find((t) => t.id === id);
      return mockAdapter.updateTemplate(id, { isFeatured: !tmpl?.isFeatured });
    }
    return apiClient.post<AppTemplate>(`/templates/${id}/toggle-featured`);
  },
};
