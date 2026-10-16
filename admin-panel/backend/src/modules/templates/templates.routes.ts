import { Router } from 'express';
import { templatesController } from './templates.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireRole, requireCorporateStaff } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validateRequest';
import { PERMISSIONS } from '../../config/constants';
import {
  templateIdParamSchema,
  createTemplateSchema,
  updateTemplateSchema,
} from './templates.schema';

const router = Router();

router.use(requireAuth, requireCorporateStaff);

router.get('/', requireRole(PERMISSIONS.VIEW_TEMPLATES), templatesController.getTemplates);
router.post(
  '/',
  requireRole(PERMISSIONS.MANAGE_TEMPLATES),
  validateRequest({ body: createTemplateSchema }),
  templatesController.createTemplate
);
router.patch(
  '/:id',
  requireRole(PERMISSIONS.MANAGE_TEMPLATES),
  validateRequest({ params: templateIdParamSchema, body: updateTemplateSchema }),
  templatesController.updateTemplate
);
router.delete(
  '/:id',
  requireRole(PERMISSIONS.MANAGE_TEMPLATES),
  validateRequest({ params: templateIdParamSchema }),
  templatesController.deleteTemplate
);
router.post(
  '/:id/toggle-publish',
  requireRole(PERMISSIONS.MANAGE_TEMPLATES),
  validateRequest({ params: templateIdParamSchema }),
  templatesController.togglePublish
);
router.post(
  '/:id/toggle-featured',
  requireRole(PERMISSIONS.MANAGE_TEMPLATES),
  validateRequest({ params: templateIdParamSchema }),
  templatesController.toggleFeatured
);

export const templatesRoutes = router;
