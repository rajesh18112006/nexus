import { Request, Response } from 'express';
import { UserRepository, OrganizationRepository } from '../repositories/user.repository';
import { ApproveUserSchema, RejectUserSchema, RoleEnum } from '@nexus/shared';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const UserController = {
  /**
   * Get all organization members with role distribution and pending counts
   */
  listMembers: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org;
    const { status, role } = req.query as { status?: string; role?: string };

    const filter: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(orgId),
      deletedAt: { $exists: false },
    };

    if (status && status !== 'ALL') {
      filter.approvalStatus = status;
    }
    if (role && role !== 'ALL') {
      filter.role = role;
    }

    const [members, allOrgUsers] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -refreshTokens')
        .populate('approvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ organizationId: new mongoose.Types.ObjectId(orgId), deletedAt: { $exists: false } }).lean(),
    ]);

    // Compute role & approval analytics for Admin dashboard
    const roleCounts: Record<string, number> = {
      admin: 0,
      procurement_manager: 0,
      warehouse_manager: 0,
      finance: 0,
      auditor: 0,
    };

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const u of allOrgUsers) {
      if (u.role && roleCounts[u.role] !== undefined) {
        roleCounts[u.role]++;
      }
      if (u.approvalStatus === 'PENDING') pendingCount++;
      else if (u.approvalStatus === 'APPROVED') approvedCount++;
      else if (u.approvalStatus === 'REJECTED') rejectedCount++;
    }

    res.json({
      success: true,
      data: {
        users: members,
        members,
        stats: {
          total: allOrgUsers.length,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          byRole: roleCounts,
          roles: roleCounts,
        },
      },
    });
  }),

  /**
   * List only users awaiting admin approval
   */
  getPending: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org;
    const pendingUsers = await UserRepository.findPendingByOrganization(orgId);
    res.json({
      success: true,
      data: {
        pendingUsers,
        count: pendingUsers.length,
      },
    });
  }),

  /**
   * Approve a user to access the organization workspace
   */
  approveUser: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org;
    const userId = req.params.id as string;
    const input = ApproveUserSchema.parse(req.body);

    const targetUser = await User.findOne({
      _id: userId,
      organizationId: new mongoose.Types.ObjectId(orgId),
      deletedAt: { $exists: false },
    });

    if (!targetUser) {
      throw new AppError(404, 'User not found in your organization.', 'USER_NOT_FOUND');
    }

    const assignedRole = input.role || targetUser.role;

    const updated = await UserRepository.updateApprovalStatus(
      userId,
      'APPROVED',
      req.user!.sub,
      assignedRole
    );

    res.json({
      success: true,
      data: updated,
      message: `${targetUser.firstName} ${targetUser.lastName} has been approved with role "${assignedRole}".`,
    });
  }),

  /**
   * Reject a user request
   */
  rejectUser: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org;
    const userId = req.params.id as string;
    const input = RejectUserSchema.parse(req.body);

    const targetUser = await User.findOne({
      _id: userId,
      organizationId: new mongoose.Types.ObjectId(orgId),
      deletedAt: { $exists: false },
    });

    if (!targetUser) {
      throw new AppError(404, 'User not found in your organization.', 'USER_NOT_FOUND');
    }

    if (targetUser._id.toString() === req.user!.sub) {
      throw new AppError(400, 'Administrators cannot reject their own account.', 'CANNOT_REJECT_SELF');
    }

    const updated = await UserRepository.updateApprovalStatus(
      userId,
      'REJECTED',
      req.user!.sub,
      undefined,
      input.reason || 'Account request rejected by administrator.'
    );

    res.json({
      success: true,
      data: updated,
      message: `Account request for ${targetUser.firstName} ${targetUser.lastName} has been declined.`,
    });
  }),

  /**
   * Update a team member's role
   */
  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org;
    const userId = req.params.id as string;
    const { role } = req.body;

    const parsedRole = RoleEnum.parse(role);

    const targetUser = await User.findOne({
      _id: userId,
      organizationId: new mongoose.Types.ObjectId(orgId),
      deletedAt: { $exists: false },
    });

    if (!targetUser) {
      throw new AppError(404, 'User not found in your organization.', 'USER_NOT_FOUND');
    }

    // Safety: ensure at least one active admin remains in org
    if (targetUser.role === 'admin' && parsedRole !== 'admin') {
      const adminCount = await User.countDocuments({
        organizationId: new mongoose.Types.ObjectId(orgId),
        role: 'admin',
        isActive: true,
        deletedAt: { $exists: false },
      });
      if (adminCount <= 1) {
        throw new AppError(400, 'Cannot demote the last remaining active Administrator.', 'LAST_ADMIN');
      }
    }

    const updated = await UserRepository.updateRole(userId, parsedRole);
    res.json({
      success: true,
      data: updated,
      message: `Role for ${targetUser.firstName} updated to ${parsedRole}.`,
    });
  }),

  /**
   * Toggle active/suspended state
   */
  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.org;
    const userId = req.params.id as string;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError(400, 'isActive boolean is required.', 'INVALID_INPUT');
    }

    const targetUser = await User.findOne({
      _id: userId,
      organizationId: new mongoose.Types.ObjectId(orgId),
      deletedAt: { $exists: false },
    });

    if (!targetUser) {
      throw new AppError(404, 'User not found in your organization.', 'USER_NOT_FOUND');
    }

    if (targetUser._id.toString() === req.user!.sub && !isActive) {
      throw new AppError(400, 'Administrators cannot deactivate their own active session.', 'CANNOT_DEACTIVATE_SELF');
    }

    const updated = await UserRepository.updateActiveStatus(userId, isActive);
    res.json({
      success: true,
      data: updated,
      message: `${targetUser.firstName} is now ${isActive ? 'active' : 'suspended'}.`,
    });
  }),

  /**
   * Public lookup endpoint for checking if an organization slug exists
   */
  lookupOrganization: asyncHandler(async (req: Request, res: Response) => {
    const rawSlug = req.params.slug;
    const slug = (typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : '').toLowerCase().trim();
    if (!slug) {
      res.json({ success: true, data: { exists: false } });
      return;
    }

    const org = await OrganizationRepository.findBySlug(slug);
    if (!org) {
      res.json({ success: true, data: { exists: false } });
      return;
    }

    res.json({
      success: true,
      data: {
        exists: true,
        name: org.name,
        slug: org.slug,
      },
    });
  }),
};
