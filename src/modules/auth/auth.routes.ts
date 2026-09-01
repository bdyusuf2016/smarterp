import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { authenticateJwt } from '../../middleware/auth.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  switchBranchSchema,
  changePasswordSchema,
} from './auth.schema';

export const authRouter = Router();

// Public routes
authRouter.post('/login', validateBody(loginSchema), AuthController.login);
authRouter.post('/refresh', validateBody(refreshTokenSchema), AuthController.refresh);

// Protected routes (Require active session & valid JWT)
authRouter.use(authenticateJwt);

authRouter.get('/me', AuthController.me);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/logout-all', AuthController.logoutAll);
authRouter.post('/switch-branch', validateBody(switchBranchSchema), AuthController.switchBranch);
authRouter.post('/change-password', validateBody(changePasswordSchema), AuthController.changePassword);
