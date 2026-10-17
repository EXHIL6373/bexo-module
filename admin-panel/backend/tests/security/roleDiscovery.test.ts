import { describe, it, expect, beforeEach } from 'vitest';
import { RoleDiscoveryService } from '../../src/modules/auth/roleDiscovery.service';
import { repository } from '../../src/db/repository';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../../src/shared/errors/AppError';

describe('RoleDiscoveryService — Authorized Role Routing & Discovery (Admin Backend)', () => {
  let roleDiscoveryService: RoleDiscoveryService;

  beforeEach(() => {
    roleDiscoveryService = new RoleDiscoveryService();
  });

  describe('1. Single Role Scenarios', () => {
    it('discovers corporate administrator from matching phone number', async () => {
      // Seed a corporate admin with a designated phone number
      const phone = '+919840011223';
      (repository as any).staffUsers.push({
        id: 'usr-admin-test-01',
        name: 'Kavin Balaji',
        email: 'kavinbalaji@atbexo.com',
        phone,
        role: 'super_admin',
        collegeId: null,
        collegeName: null,
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      const res = await roleDiscoveryService.discoverRolesForPhone(phone);
      expect(res.requiresRoleSelection).toBe(false);
      expect(res.availableRoles.length).toBe(1);
      expect(res.selectedRole?.role).toBe('super_admin');
      expect(res.selectedRole?.portal).toBe('admin');
      expect(res.selectedRole?.landingPath).toBe('/admin');
      expect(res.token).toBeDefined();
      expect(res.user?.role).toBe('super_admin');
    });

    it('discovers college management staff from matching phone number', async () => {
      const phone = '+919876500001';
      (repository as any).staffUsers.push({
        id: 'usr-clg-test-01',
        name: 'Dean Venkatesh',
        email: 'venkatesh.r@psgtech.edu',
        phone,
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      const res = await roleDiscoveryService.discoverRolesForPhone(phone);
      expect(res.requiresRoleSelection).toBe(false);
      expect(res.availableRoles.length).toBe(1);
      expect(res.selectedRole?.role).toBe('college_admin');
      expect(res.selectedRole?.portal).toBe('college');
      expect(res.selectedRole?.landingPath).toBe('/college/dashboard');
      expect(res.selectedRole?.collegeId).toBe('clg-psg-01');
      expect(res.token).toBeDefined();
    });

    it('discovers enrolled college student with premium entitlements from student roster', async () => {
      const phone = '+919876500002';
      (repository as any).students.push({
        id: 'stu-test-01',
        name: 'Aditya S',
        email: 'aditya.s@psgtech.edu',
        phone,
        rollNumber: '21CS001',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        accessStatus: 'Active',
        services: ['AI Resume Builder', 'Portfolio Engine', 'Skill Assessment'],
      });

      const res = await roleDiscoveryService.discoverRolesForPhone(phone);
      expect(res.requiresRoleSelection).toBe(false);
      expect(res.availableRoles.length).toBe(1);
      expect(res.selectedRole?.role).toBe('college_user');
      expect(res.selectedRole?.portal).toBe('user');
      expect(res.selectedRole?.hasPremium).toBe(true);
      expect(res.selectedRole?.services).toContain('AI Resume Builder');
      expect(res.token).toBeDefined();
    });

    it('provisions normal consumer user when phone number matches neither staff nor students', async () => {
      const phone = '+919999911111';

      const res = await roleDiscoveryService.discoverRolesForPhone(phone);
      expect(res.requiresRoleSelection).toBe(false);
      expect(res.availableRoles.length).toBe(1);
      expect(res.selectedRole?.role).toBe('normal_user');
      expect(res.selectedRole?.portal).toBe('user');
      expect(res.selectedRole?.hasPremium).toBe(false);
      expect(res.selectedRole?.services).toEqual([]);
      expect(res.token).toBeDefined();
    });
  });

  describe('2. Multi-Role Scenarios & Pre-Auth Selection Gate', () => {
    it('requires server-validated role selection when phone is associated with multiple personas', async () => {
      const sharedPhone = '+919876588888';

      // 1. Associate sharedPhone with college staff
      (repository as any).staffUsers.push({
        id: 'usr-dual-staff',
        name: 'Dr. Ramesh Kumar',
        email: 'ramesh.k@psgtech.edu',
        phone: sharedPhone,
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      // 2. Associate sharedPhone with executive enrolled student
      (repository as any).students.push({
        id: 'stu-dual-student',
        name: 'Ramesh Kumar (PG)',
        email: 'ramesh.pg@psgtech.edu',
        phone: sharedPhone,
        rollNumber: '24EMBA01',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        accessStatus: 'Active',
        services: ['AI Resume Builder'],
      });

      const discoveryRes = await roleDiscoveryService.discoverRolesForPhone(sharedPhone);
      expect(discoveryRes.requiresRoleSelection).toBe(true);
      expect(discoveryRes.token).toBeUndefined(); // Must NOT issue session token immediately!
      expect(discoveryRes.preAuthToken).toBeDefined();
      expect(discoveryRes.availableRoles.length).toBe(2);

      const staffRole = discoveryRes.availableRoles.find((r) => r.entityType === 'college_staff')!;
      const studentRole = discoveryRes.availableRoles.find((r) => r.entityType === 'student')!;

      // 3. User selects College Staff role
      const selectStaffRes = await roleDiscoveryService.selectRole(
        discoveryRes.preAuthToken!,
        staffRole.id
      );
      expect(selectStaffRes.success).toBe(true);
      expect(selectStaffRes.token).toBeDefined();
      expect(selectStaffRes.selectedRole.role).toBe('college_admin');
      expect(selectStaffRes.selectedRole.portal).toBe('college');

      // 4. User selects Student role
      const selectStudentRes = await roleDiscoveryService.selectRole(
        discoveryRes.preAuthToken!,
        studentRole.id
      );
      expect(selectStudentRes.success).toBe(true);
      expect(selectStudentRes.token).toBeDefined();
      expect(selectStudentRes.selectedRole.role).toBe('college_user');
      expect(selectStudentRes.selectedRole.portal).toBe('user');
    });

    it('strictly rejects forged or unauthorized role selection with ForbiddenError', async () => {
      const phone = '+919876577777';
      (repository as any).students.push({
        id: 'stu-single-02',
        name: 'Pooja R',
        email: 'pooja.r@psgtech.edu',
        phone,
        rollNumber: '21CS099',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        accessStatus: 'Active',
      });

      (repository as any).staffUsers.push({
        id: 'usr-single-staff-02',
        name: 'Pooja R (TA)',
        email: 'pooja.ta@psgtech.edu',
        phone,
        role: 'college_staff',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      const discoveryRes = await roleDiscoveryService.discoverRolesForPhone(phone);
      expect(discoveryRes.requiresRoleSelection).toBe(true);

      // Attempting to select an arbitrary forged corporate super_admin role ID
      await expect(
        roleDiscoveryService.selectRole(discoveryRes.preAuthToken!, 'role-admin-forged-999')
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects tampered or malformed pre-auth selection token with UnauthorizedError', async () => {
      await expect(
        roleDiscoveryService.selectRole('tampered.jwt.token', 'role-clg-01')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
