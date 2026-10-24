import { Request, Response, NextFunction } from 'express';

export type UserRole = 'admin' | 'creator' | 'reviewer' | 'solo';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }

    const { role } = req.user;

    // Solo role has creator + admin privileges inside their workspace
    if (role === 'solo') {
      next();
      return;
    }

    // Admin has reviewer + creator privileges as well
    if (role === 'admin') {
      next();
      return;
    }

    if (allowedRoles.includes(role)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Forbidden: Role '${role}' lacks required permissions for this action. Required: ${allowedRoles.join(', ')}`
    });
  };
}
