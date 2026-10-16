import { Router } from 'express';
import { studentsController } from './students.controller';
import { validateRequest } from '../../shared/validation/validateRequest';
import {
  studentFilterQuerySchema,
  addStudentSchema,
  updateStudentSchema,
  revokeStudentSchema,
  bulkImportSchema,
} from './students.schemas';
import { requireAuth } from '../../middlewares/auth';
import { requireCollegeTenant } from '../../middlewares/tenant';
import { requirePermission } from '../../middlewares/permissions';

const router = Router();

router.use(requireAuth, requireCollegeTenant);

router.get(
  '/students',
  requirePermission('VIEW_STUDENTS'),
  validateRequest({ query: studentFilterQuerySchema }),
  studentsController.getStudents
);

router.get('/students/:id', requirePermission('VIEW_STUDENTS'), studentsController.getStudentById);

router.post(
  '/students',
  requirePermission('CREATE_STUDENT'),
  validateRequest({ body: addStudentSchema }),
  studentsController.addStudent
);

router.patch(
  '/students/:id',
  requirePermission('UPDATE_STUDENT'),
  validateRequest({ body: updateStudentSchema }),
  studentsController.updateStudent
);

router.post(
  '/students/:id/revoke',
  requirePermission('UPDATE_STUDENT'),
  validateRequest({ body: revokeStudentSchema }),
  studentsController.revokeAccess
);

router.post(
  '/students/:id/reactivate',
  requirePermission('UPDATE_STUDENT'),
  studentsController.reactivateAccess
);

router.post(
  '/students/bulk-import',
  requirePermission('IMPORT_STUDENTS'),
  validateRequest({ body: bulkImportSchema }),
  studentsController.bulkImport
);

export const studentsRoutes = router;
