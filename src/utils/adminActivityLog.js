const prisma = require('../config/prisma');
const logger = require('../config/logger');

/**
 * Fire-and-forget audit log write for admin mutating actions. Failures are
 * logged but never block the admin's actual request.
 */
async function logAdminActivity(req, { action, entityType, entityId, details }) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId: req.user.id,
        action,
        entityType,
        entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
        details: details || undefined,
        ipAddress: req.ip,
      },
    });
  } catch (err) {
    logger.error(`[adminActivityLog] Failed to record activity: ${err.message}`);
  }
}

module.exports = { logAdminActivity };
