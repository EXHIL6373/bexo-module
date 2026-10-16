import { store } from '../../db/store';

export class ActivityService {
  async getActivityLogs(collegeId: string) {
    return store.getAuditLogsByCollege(collegeId);
  }

  async exportReport(collegeId: string, reportType: 'students' | 'provisioning' | 'entitlements') {
    let csvHeader = '';
    let csvRows: string[] = [];

    if (reportType === 'students') {
      const { students } = await store.getStudentsByCollege(collegeId);
      csvHeader = 'RollNumber,Name,Department,Course,Batch,Email,Status,Services\n';
      csvRows = students.map(
        (s: any) =>
          `"${s.rollNumber}","${s.name}","${s.department}","${s.course || ''}","${s.batch || ''}","${s.email}","${s.accessStatus}","${(s.services || []).join(';')}"`
      );
    } else if (reportType === 'provisioning') {
      const jobs = await store.getProvisioningJobsByCollege(collegeId);
      csvHeader = 'JobId,Source,Status,TotalRecords,Successful,Failed,CreatedAt,CompletedAt\n';
      csvRows = jobs.map(
        (j: any) =>
          `"${j.id}","${j.source}","${j.status}",${j.totalRecords},${j.successful},${j.failed},"${j.createdAt}","${j.completedAt || ''}"`
      );
    } else {
      const ents = await store.getEntitlementsByCollege(collegeId);
      csvHeader = 'EntitlementId,RollNumber,StudentName,ServiceName,Status,GrantedDate\n';
      csvRows = ents.map(
        (e: any) => `"${e.id}","${e.rollNumber}","${e.studentName}","${e.serviceName}","${e.status}","${e.grantedDate}"`
      );
    }

    const csvContent = csvHeader + csvRows.join('\n');
    return {
      reportType,
      csvContent,
      downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
    };
  }
}

export const activityService = new ActivityService();
