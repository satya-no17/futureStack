"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...allowedRoles) {
    return (req, res, next) => {
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
