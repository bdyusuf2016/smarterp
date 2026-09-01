import { Router } from 'express';
import { LibraryController } from './library.controller';
import { authenticateJwt } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/rbac.middleware';
import { requireModule } from '../../../middleware/module.middleware';
import { validateBody } from '../../../middleware/validation.middleware';
import {
  createBookTitleSchema,
  registerBookCopySchema,
  createMemberSchema,
  issueBookSchema,
  returnBookSchema,
} from './library.schema';

export const libraryRouter = Router();

// Protect all library routes with JWT + LIBRARY module check
libraryRouter.use(authenticateJwt);
libraryRouter.use(requireModule('LIBRARY'));

libraryRouter.post('/titles', requirePermission('products.create'), validateBody(createBookTitleSchema), LibraryController.createTitle);
libraryRouter.post('/copies', requirePermission('products.create'), validateBody(registerBookCopySchema), LibraryController.registerCopy);
libraryRouter.post('/members', requirePermission('customers.create'), validateBody(createMemberSchema), LibraryController.createMember);
libraryRouter.post('/borrows/issue', requirePermission('sales.create'), validateBody(issueBookSchema), LibraryController.issueBook);
libraryRouter.post('/borrows/return', requirePermission('sales.create'), validateBody(returnBookSchema), LibraryController.returnBook);
