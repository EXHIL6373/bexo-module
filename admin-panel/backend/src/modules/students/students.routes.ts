import { Router } from 'express';
import { studentsController } from './students.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import {
  studentIdParamSchema,
  createStudentSchema,
  revokeStudentSchema,
} from './students.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_STUDENTS), studentsController.getStudents);
router.get(
  '/:id',
  requireRole(PERMISSIONS.VIEW_STUDENTS),
  validateRequest({ params: studentIdParamSchema }),
  studentsController.getStudentById
);
router.post(
  '/',
  requireRole(PERMISSIONS.MANAGE_STUDENTS),
  validateRequest({ body: createStudentSchema }),
  studentsController.addStudent
);
router.post(
  '/:id/revoke',
  requireRole(PERMISSIONS.MANAGE_STUDENTS),
  validateRequest({ params: studentIdParamSchema, body: revokeStudentSchema }),
  studentsController.revokeAccess
);
router.post(
  '/:id/reactivate',
  requireRole(PERMISSIONS.MANAGE_STUDENTS),
  validateRequest({ params: studentIdParamSchema }),
  studentsController.reactivateAccess
);

export const studentsRoutes = router;
