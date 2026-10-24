import { User, type IUser } from '../models/User';
import { Organization, type IOrganization } from '../models/Organization';
import mongoose from 'mongoose';

export const UserRepository = {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const q = User.findOne({ email: email.toLowerCase(), deletedAt: { $exists: false } });
    if (includePassword) q.select('+passwordHash');
    return q.populate('organizationId', 'name slug currency locale').exec();
  },

  async findByEmailWithVerification(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), deletedAt: { $exists: false } })
      .select('+emailVerificationCode +emailVerificationExpiresAt +passwordHash')
      .populate('organizationId', 'name slug currency locale')
      .exec();
  },

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('organizationId', 'name slug currency locale settings')
      .exec();
  },

  async findByIdWithRefreshTokens(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, deletedAt: { $exists: false } })
      .select('+refreshTokens')
      .exec();
  },

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    role: IUser['role'];
    organizationId: string;
    isActive?: boolean;
    approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    isEmailVerified?: boolean;
    emailVerificationCode?: string;
    emailVerificationExpiresAt?: Date;
    googleId?: string;
    avatarUrl?: string;
    authProvider?: 'local' | 'google';
  }): Promise<IUser> {
    const user = new User({
      ...data,
      organizationId: new mongoose.Types.ObjectId(data.organizationId),
      approvedBy: data.approvedBy ? new mongoose.Types.ObjectId(data.approvedBy) : undefined,
    });
    return user.save();
  },

  async addRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    meta: { userAgent?: string; ip?: string }
  ): Promise<void> {
    // Keep max 5 active refresh tokens per user (devices)
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          $each: [{ tokenHash, expiresAt, createdAt: new Date(), ...meta }],
          $slice: -5,  // keep newest 5
        },
      },
      lastLogin: new Date(),
    });
  },

  async removeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { tokenHash } },
    });
  },

  async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  },

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  },

  async findByOrganization(
    organizationId: string,
    filters: { isActive?: boolean; role?: string; approvalStatus?: string } = {}
  ): Promise<IUser[]> {
    const query: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      deletedAt: { $exists: false },
    };
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.role) query.role = filters.role;
    if (filters.approvalStatus) query.approvalStatus = filters.approvalStatus;
    return User.find(query).sort({ createdAt: -1 }).exec();
  },

  async findPendingByOrganization(organizationId: string): Promise<IUser[]> {
    return User.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      approvalStatus: 'PENDING',
      deletedAt: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .exec();
  },

  async updateApprovalStatus(
    userId: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
    approvedBy?: string,
    role?: IUser['role'],
    rejectionReason?: string
  ): Promise<IUser | null> {
    const update: Record<string, any> = {
      approvalStatus,
      approvedAt: new Date(),
      isActive: approvalStatus === 'APPROVED',
    };
    if (approvedBy) update.approvedBy = new mongoose.Types.ObjectId(approvedBy);
    if (role) update.role = role;
    if (rejectionReason) update.rejectionReason = rejectionReason;

    return User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .populate('organizationId', 'name slug currency locale')
      .exec();
  },

  async updateRole(userId: string, role: IUser['role']): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { $set: { role } }, { new: true }).exec();
  },

  async updateActiveStatus(userId: string, isActive: boolean): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { $set: { isActive } }, { new: true }).exec();
  },

  async softDelete(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      deletedAt: new Date(),
      isActive: false,
      refreshTokens: [],
    });
  },
};

export const OrganizationRepository = {
  async create(data: {
    name: string;
    slug: string;
  }): Promise<IOrganization> {
    const org = new Organization(data);
    return org.save();
  },

  async findBySlug(slug: string): Promise<IOrganization | null> {
    return Organization.findOne({ slug: slug.toLowerCase() }).exec();
  },

  async findById(id: string): Promise<IOrganization | null> {
    return Organization.findById(id).exec();
  },

  async updateSettings(id: string, settings: Partial<IOrganization['settings']>): Promise<IOrganization | null> {
    return Organization.findByIdAndUpdate(
      id,
      { $set: { settings } },
      { new: true }
    ).exec();
  },
};
