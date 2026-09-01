import { Router } from 'express';
import { TelecomController } from './telecom.controller';
import { authenticateJwt } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { requireModule } from '../../../middleware/module.middleware';
import { validateBody } from '../../../middleware/validation.middleware';
import {
  registerDeviceSchema,
  createRepairJobSchema,
  updateRepairStatusSchema,
  createTradeInSchema,
  recordRechargeSchema,
} from './telecom.schema';

export const telecomRouter = Router();

// Protect all telecom routes with JWT + TELECOM module check
telecomRouter.use(authenticateJwt);
telecomRouter.use(requireModule('TELECOM'));

// Devices & IMEI
telecomRouter.get('/devices', requirePermission('devices.view'), TelecomController.getDevices);
telecomRouter.post('/devices', requirePermission('devices.create'), validateBody(registerDeviceSchema), TelecomController.registerDevice);
telecomRouter.get('/devices/imei/:imei', requirePermission('devices.view'), TelecomController.findByImei);

// Repairs & Jobs
telecomRouter.get('/repairs', requirePermission('repairs.view'), TelecomController.getRepairJobs);
telecomRouter.post('/repairs', requirePermission('repairs.create'), validateBody(createRepairJobSchema), TelecomController.createRepairJob);
telecomRouter.patch('/repairs/:id/status', requirePermission('repairs.update'), validateBody(updateRepairStatusSchema), TelecomController.updateRepairStatus);

// Trade-Ins
telecomRouter.get('/trade-ins', requirePermission('tradeins.view'), TelecomController.getTradeIns);
telecomRouter.post('/trade-ins', requirePermission('tradeins.create'), validateBody(createTradeInSchema), TelecomController.createTradeIn);

// Operator Recharges
telecomRouter.get('/recharges', requirePermission('recharges.view'), TelecomController.getRecharges);
telecomRouter.post('/recharges', requirePermission('recharges.create'), validateBody(recordRechargeSchema), TelecomController.recordRecharge);
