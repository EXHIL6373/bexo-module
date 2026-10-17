import { describe, it, expect, beforeEach } from 'vitest';
import { RoleDiscoveryService } from '../../src/modules/auth/roleDiscovery.service';
import { store } from '../../src/db/store';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../../src/shared/errors/AppError';

function generateTestPhone(): string {
  return `+919${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

describe('RoleDiscoveryService — Authorized Role Routing & Discovery (College Backend)', () => {
  let roleDiscoveryService: RoleDiscoveryService;

  beforeEach(() => {
    roleDiscoveryService = new RoleDiscoveryService();
  });

  describe('1. Single Role Scenarios', () => {
    it('discovers corporate administrator from matching phone number', async () => {
      const phone = generateTestPhone();
      const staffId = generateUniqueId('usr-admin');

      await store.createStaffUser({
        id: staffId,
        name: 'Kavin Balaji',
        email: `kavin.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@atbexo.com`,
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
      const phone = generateTestPhone();
      const staffId = generateUniqueId('usr-clg');

      await store.createStaffUser({
        id: staffId,
        name: 'Dean Venkatesh',
        email: `venkatesh.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@psgtech.edu`,
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
      const phone = generateTestPhone();
      const studentId = generateUniqueId('stu');

      await store.createStudent({
        id: studentId,
        name: 'Aditya S',
        email: `aditya.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@psgtech.edu`,
        phone,
        rollNumber: `21CS${Math.floor(Math.random() * 900 + 100)}`,
        department: 'Computer Science and Engineering',
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
      const phone = generateTestPhone();

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
      const sharedPhone = generateTestPhone();
      const staffId = generateUniqueId('usr-dual-staff');
      const studentId = generateUniqueId('stu-dual-student');

      // 1. Associate sharedPhone with college staff
      await store.createStaffUser({
        id: staffId,
        name: 'Dr. Ramesh Kumar',
        email: `ramesh.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@psgtech.edu`,
        phone: sharedPhone,
        role: 'college_admin',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        isActive: true,
        accountStatus: 'ACTIVE',
      });

      // 2. Associate sharedPhone with executive enrolled student
      await store.createStudent({
        id: studentId,
        name: 'Ramesh Kumar (PG)',
        email: `ramesh.pg.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@psgtech.edu`,
        phone: sharedPhone,
        rollNumber: `24EMBA${Math.floor(Math.random() * 900 + 100)}`,
        department: 'Management Studies',
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
      const phone = generateTestPhone();
      const studentId = generateUniqueId('stu-single');
      const staffId = generateUniqueId('usr-single-staff');

      await store.createStudent({
        id: studentId,
        name: 'Pooja R',
        email: `pooja.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@psgtech.edu`,
        phone,
        rollNumber: `21CS${Math.floor(Math.random() * 900 + 100)}`,
        department: 'Computer Science and Engineering',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG College of Technology',
        accessStatus: 'Active',
      });

      await store.createStaffUser({
        id: staffId,
        name: 'Pooja R (TA)',
        email: `pooja.ta.${Date.now()}.${Math.random().toString(36).slice(2, 5)}@psgtech.edu`,
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
