import { Router } from 'express';
import { systemController } from './system.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireCorporateStaff } from '../../middlewares/rbac';

const router = Router();

// /system/health endpoint for frontend telemetry dashboard (requires auth)
router.get('/system/health', requireAuth, requireCorporateStaff, systemController.getSystemHealth);

// /health lightweight endpoint for ALB/ingress health checks (public, no secrets exposed)
router.get('/health', systemController.getLiveness);

export const systemRoutes = router;
