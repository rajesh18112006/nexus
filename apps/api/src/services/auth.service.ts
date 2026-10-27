import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UserRepository, OrganizationRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/errorHandler';
import { EmailService } from './email.service';
import type { RegisterInput, LoginInput, TokenPayload, AuthUser, VerifyEmailInput, ResendCodeInput, GoogleAuthInput } from '@nexus/shared';
import { User } from '../models/User';
import { GoogleAuthService } from './googleAuth.service';

// ─── Password Hashing ─────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token Generation ─────────────────────────────────────────────────────
export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: (env.ACCESS_TOKEN_EXPIRY || '15m') as any,
  });
}

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function getRefreshTokenExpiry(): Date {
  const match = env.REFRESH_TOKEN_EXPIRY.match(/^(\d+)([dhm])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, n, unit] = match;
  const ms =
    unit === 'd' ? Number(n) * 86400000
    : unit === 'h' ? Number(n) * 3600000
    : Number(n) * 60000;
  return new Date(Date.now() + ms);
}

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const AuthService = {
  async register(
    input: RegisterInput,
    meta?: { ip: string; userAgent?: string }
  ): Promise<
    | { requiresVerification: false; accessToken: string; refreshToken: string; user: AuthUser; organizationName: string; isJoinOrg: false }
    | { requiresVerification: true; email: string; organizationName: string; isJoinOrg: boolean; previewUrl?: string }
  > {
    // Check email uniqueness
    const existingUser = await UserRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
    }

    const isJoinOrg = input.mode === 'join_org';
    let orgId: string;
    let orgName: string;
    let role = input.role || 'admin';
    let approvalStatus: 'APPROVED' | 'PENDING' = 'APPROVED';

    if (isJoinOrg) {
      // Joining existing organization workspace
      const existingOrg = await OrganizationRepository.findBySlug(input.organizationSlug);
      if (!existingOrg) {
        throw new AppError(
          404,
          `Organization workspace with identifier "${input.organizationSlug}" was not found. Please verify the workspace identifier with your administrator.`,
          'ORG_NOT_FOUND'
        );
      }
      orgId = existingOrg._id.toString();
      orgName = existingOrg.name;
      role = input.role || 'warehouse_manager';
      approvalStatus = 'PENDING';
    } else {
      // Creating new organization workspace
      const existingOrg = await OrganizationRepository.findBySlug(input.organizationSlug);
      if (existingOrg) {
        throw new AppError(409, 'An organization with this slug already exists. Please choose a different slug.', 'SLUG_TAKEN');
      }

      const org = await OrganizationRepository.create({
        name: input.organizationName || `${input.firstName}'s Enterprise`,
        slug: input.organizationSlug,
      });
      orgId = org._id.toString();
      orgName = org.name;
      role = 'admin';
      approvalStatus = 'APPROVED';
    }

    const isAdminUser = role === 'admin' || !isJoinOrg;

    if (isAdminUser) {
      // Admin accounts do not require email verification code
      const passwordHash = await hashPassword(input.password);
      const user = await UserRepository.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        role: 'admin',
        organizationId: orgId,
        approvalStatus: 'APPROVED',
        isActive: true,
        isEmailVerified: true,
      });

      // Bootstrap initial supply chain dataset immediately for new organization admin
      try {
        const { bootstrapOrganizationData } = await import('./starterData.service');
        await bootstrapOrganizationData(orgId, user._id.toString(), `${user.firstName} ${user.lastName}`);
      } catch (bootstrapErr) {
        console.error('Starter data bootstrap warning:', bootstrapErr);
      }

      // Automatically issue session tokens for seamless instant login
      const clientMeta = meta || { ip: 'unknown' };
      const { accessToken, refreshToken } = await AuthService._issueTokens(
        user._id.toString(),
        orgId,
        user.role,
        clientMeta,
        'APPROVED'
      );

      const authUser: AuthUser = {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: orgId,
        organizationName: orgName,
        approvalStatus: 'APPROVED',
        isApproved: true,
        isActive: true,
        createdAt: user.createdAt.toISOString(),
      };

      return {
        requiresVerification: false,
        accessToken,
        refreshToken,
        user: authUser,
        organizationName: orgName,
        isJoinOrg: false,
      };
    }

    // For team members joining an existing workspace: require email confirmation & admin approval
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const passwordHash = await hashPassword(input.password);
    const user = await UserRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      role,
      organizationId: orgId,
      approvalStatus,
      isActive: false,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpiresAt: verificationExpiresAt,
    });

    // Send real verification email via Nodemailer
    const emailResult = await EmailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationCode
    );

    return {
      requiresVerification: true,
      email: user.email,
      organizationName: orgName,
      isJoinOrg,
      previewUrl: emailResult.previewUrl,
    };
  },

  async verifyEmail(
    input: VerifyEmailInput,
    meta: { ip: string; userAgent?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    const user = await UserRepository.findByEmailWithVerification(input.email);

    if (!user) {
      throw new AppError(404, 'No account found matching this email address.', 'USER_NOT_FOUND');
    }

    if (user.isEmailVerified) {
      // Already verified, issue tokens directly
      const orgId = (user.organizationId as any)._id?.toString() ?? user.organizationId.toString();
      const orgName = (user.organizationId as any).name ?? 'Unknown';
      const { accessToken, refreshToken } = await AuthService._issueTokens(
        user._id.toString(),
        orgId,
        user.role,
        meta,
        user.approvalStatus || 'APPROVED'
      );
      return {
        accessToken,
        refreshToken,
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          organizationId: orgId,
          organizationName: orgName,
          approvalStatus: user.approvalStatus || 'APPROVED',
          isApproved: (user.approvalStatus || 'APPROVED') === 'APPROVED',
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
        },
      };
    }

    // Verify code
    if (user.emailVerificationCode !== input.code.trim()) {
      throw new AppError(400, 'Invalid 6-digit confirmation code. Please check and try again.', 'INVALID_CODE');
    }

    if (user.emailVerificationExpiresAt && new Date() > user.emailVerificationExpiresAt) {
      throw new AppError(400, 'Confirmation code has expired. Please click Resend Code to receive a new one.', 'CODE_EXPIRED');
    }

    // Mark verified and clear verification code fields
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    // Bootstrap starter supply chain dataset only if org creator admin
    if (user.approvalStatus === 'APPROVED' && user.role === 'admin') {
      try {
        const { bootstrapOrganizationData } = await import('./starterData.service');
        const orgId = (user.organizationId as any)._id?.toString() ?? user.organizationId.toString();
        await bootstrapOrganizationData(orgId, user._id.toString(), `${user.firstName} ${user.lastName}`);
      } catch (bootstrapErr) {
        console.error('Starter data bootstrap warning:', bootstrapErr);
      }
    }

    const orgId = (user.organizationId as any)._id?.toString() ?? user.organizationId.toString();
    const orgName = (user.organizationId as any).name ?? 'Organization';

    const { accessToken, refreshToken } = await AuthService._issueTokens(
      user._id.toString(),
      orgId,
      user.role,
      meta,
      user.approvalStatus || 'APPROVED'
    );

    const authUser: AuthUser = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      organizationName: orgName,
      approvalStatus: user.approvalStatus || 'APPROVED',
      isApproved: (user.approvalStatus || 'APPROVED') === 'APPROVED',
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };

    return { accessToken, refreshToken, user: authUser };
  },

  async resendVerificationCode(input: ResendCodeInput): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    const user = await User.findOne({ email: input.email.toLowerCase(), deletedAt: { $exists: false } }).select('+emailVerificationCode +emailVerificationExpiresAt');

    if (!user) {
      // Do not leak user existence
      return { success: true, message: 'If an account exists, a new verification code has been dispatched.' };
    }

    if (user.isEmailVerified) {
      return { success: true, message: 'Your email address is already verified. You can sign in.' };
    }

    // Generate fresh code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const emailResult = await EmailService.sendVerificationEmail(user.email, user.firstName, verificationCode);

    return {
      success: true,
      message: 'A fresh 6-digit verification code has been dispatched to your email.',
      previewUrl: emailResult.previewUrl,
    };
  },

  async login(
    input: LoginInput,
    meta: { ip: string; userAgent?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    const user = await UserRepository.findByEmail(input.email, true);

    if (!user || !user.isActive) {
      // Use same timing to prevent user enumeration
      await hashPassword('dummy-check');
      throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // Demo accounts and admin accounts never require email verification codes
    const isDemoAccount = user.email.endsWith('.demo') || user.email.includes('nexus.demo');

    if (user.role === 'admin' || isDemoAccount) {
      if (user.isEmailVerified !== true) {
        user.isEmailVerified = true;
        user.approvalStatus = 'APPROVED';
        await user.save();
      }
    } else if (user.isEmailVerified === false) {
      // Auto-trigger fresh code if expired for real newly registered non-admin users
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await User.findByIdAndUpdate(user._id, {
        emailVerificationCode: verificationCode,
        emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      await EmailService.sendVerificationEmail(user.email, user.firstName, verificationCode);

      throw new AppError(
        403,
        'Your email address is not verified yet. We have dispatched a 6-digit confirmation code to your inbox.',
        'EMAIL_NOT_VERIFIED',
        { email: user.email }
      );
    }

    const orgId = (user.organizationId as any)._id?.toString() ?? user.organizationId.toString();
    const orgName = (user.organizationId as any).name ?? 'Unknown';

    const { accessToken, refreshToken } = await AuthService._issueTokens(
      user._id.toString(),
      orgId,
      user.role,
      meta,
      user.approvalStatus || 'APPROVED'
    );

    const authUser: AuthUser = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      organizationName: orgName,
      approvalStatus: user.approvalStatus || 'APPROVED',
      isApproved: (user.approvalStatus || 'APPROVED') === 'APPROVED',
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };

    return { accessToken, refreshToken, user: authUser };
  },

  async loginWithGoogle(
    input: GoogleAuthInput,
    meta: { ip: string; userAgent?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
    let email = input.email?.toLowerCase().trim();
    let firstName = input.firstName?.trim();
    let lastName = input.lastName?.trim() || '';
    let googleId = input.googleId;
    let avatarUrl = input.avatarUrl;

    // Cryptographically verify ID token or exchange authorization code if provided
    if (input.idToken) {
      const verified = await GoogleAuthService.verifyIdToken(input.idToken);
      email = verified.email.toLowerCase().trim();
      firstName = firstName || verified.firstName;
      lastName = lastName || verified.lastName;
      googleId = googleId || verified.googleId;
      avatarUrl = avatarUrl || verified.avatarUrl;
    } else if (input.code) {
      const verified = await GoogleAuthService.exchangeCode(input.code);
      email = verified.email.toLowerCase().trim();
      firstName = firstName || verified.firstName;
      lastName = lastName || verified.lastName;
      googleId = googleId || verified.googleId;
      avatarUrl = avatarUrl || verified.avatarUrl;
    }

    if (!email) {
      throw new AppError(400, 'Valid Google email is required for authentication.', 'INVALID_GOOGLE_INPUT');
    }
    if (!firstName) {
      firstName = email.split('@')[0] || 'User';
    }

    let user = await User.findOne({ email, deletedAt: { $exists: false } }).populate('organizationId');

    if (user) {
      // Existing user: ensure email is verified since verified by Google OAuth
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpiresAt = undefined;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      if (googleId && !user.googleId) {
        user.googleId = googleId;
      }
      user.lastLogin = new Date();
      await user.save();
    } else {
      // New user signup via Google
      const isJoinOrg = input.mode === 'join_org' && Boolean(input.organizationSlug);
      let orgId: string;
      let orgName: string;
      let role = input.role || 'admin';
      let approvalStatus: 'APPROVED' | 'PENDING' = 'APPROVED';

      if (isJoinOrg) {
        const existingOrg = await OrganizationRepository.findBySlug(input.organizationSlug!);
        if (!existingOrg) {
          throw new AppError(
            404,
            `Organization workspace "${input.organizationSlug}" was not found. Please verify the workspace identifier.`,
            'ORG_NOT_FOUND'
          );
        }
        orgId = existingOrg._id.toString();
        orgName = existingOrg.name;
        role = input.role || 'warehouse_manager';
        approvalStatus = 'PENDING';
      } else {
        orgName = `${firstName}'s Organization`;
        const baseSlug = firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'workspace';
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        const org = await OrganizationRepository.create({
          name: orgName,
          slug,
        });
        orgId = org._id.toString();
        role = 'admin';
        approvalStatus = 'APPROVED';
      }

      const randomPassword = crypto.randomBytes(32).toString('hex') + 'A1!';
      const passwordHash = await hashPassword(randomPassword);

      const createdUser = await UserRepository.create({
        firstName,
        lastName,
        email,
        passwordHash,
        role,
        organizationId: orgId,
        isEmailVerified: true,
        approvalStatus,
        isActive: approvalStatus === 'APPROVED',
        googleId,
        avatarUrl,
        authProvider: 'google',
      });

      if (!isJoinOrg) {
        // Bootstrap starter supply chain dataset for new organization
        try {
          const { bootstrapOrganizationData } = await import('./starterData.service');
          await bootstrapOrganizationData(
            orgId,
            createdUser._id.toString(),
            `${firstName} ${lastName}`.trim()
          );
        } catch (err) {
          console.error('Google signup starter data bootstrap error:', err);
        }
      }

      user = await User.findById(createdUser._id).populate('organizationId');
    }

    if (!user) {
      throw new AppError(500, 'Unable to initialize user session.', 'AUTH_FAILED');
    }

    const orgId = (user.organizationId as any)?._id?.toString() ?? user.organizationId.toString();
    const orgName = (user.organizationId as any)?.name ?? `${user.firstName}'s Organization`;

    const { accessToken, refreshToken } = await AuthService._issueTokens(
      user._id.toString(),
      orgId,
      user.role,
      meta,
      user.approvalStatus || 'APPROVED'
    );

    const authUser: AuthUser = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      organizationName: orgName,
      approvalStatus: user.approvalStatus || 'APPROVED',
      isApproved: (user.approvalStatus || 'APPROVED') === 'APPROVED',
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };

    return { accessToken, refreshToken, user: authUser };
  },

  async refresh(
    rawRefreshToken: string,
    meta: { ip: string; userAgent?: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Search across users for this hashed refresh token
    const { User } = await import('../models/User');
    const foundUser = await User.findOne({
      'refreshTokens.tokenHash': tokenHash,
      'refreshTokens.expiresAt': { $gt: new Date() },
      isActive: true,
      deletedAt: { $exists: false },
    }).select('+refreshTokens');

    if (!foundUser) {
      throw new AppError(401, 'Invalid or expired refresh token. Please log in again.', 'REFRESH_INVALID');
    }

    // Rotate: remove old, issue new
    await UserRepository.removeRefreshToken(foundUser._id.toString(), tokenHash);
    const { accessToken, refreshToken } = await AuthService._issueTokens(
      foundUser._id.toString(),
      foundUser.organizationId.toString(),
      foundUser.role,
      meta,
      foundUser.approvalStatus || 'APPROVED'
    );

    return { accessToken, refreshToken };
  },

  async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await UserRepository.removeRefreshToken(userId, tokenHash);
    } else {
      // Logout all devices
      await UserRepository.removeAllRefreshTokens(userId);
    }
  },

  async _issueTokens(
    userId: string,
    orgId: string,
    role: string,
    meta: { ip: string; userAgent?: string },
    approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED' = 'APPROVED'
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = generateAccessToken({
      sub: userId,
      org: orgId,
      role: role as any,
      approvalStatus: approvalStatus as any,
    });

    const { raw, hash } = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await UserRepository.addRefreshToken(userId, hash, expiresAt, meta);

    return { accessToken, refreshToken: raw };
  },
};
