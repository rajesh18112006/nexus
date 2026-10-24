import { Request, Response } from 'express';
import { RegisterSchema, LoginSchema, VerifyEmailSchema, ResendCodeSchema, GoogleAuthSchema } from '@nexus/shared';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

import { GoogleAuthService } from '../services/googleAuth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d in ms
  path: '/api/v1/auth',
};

const getMeta = (req: Request) => ({
  ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown',
  userAgent: req.headers['user-agent'],
});

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = RegisterSchema.parse(req.body);
    const result = await AuthService.register(input, getMeta(req));
    if ((result as any).refreshToken) {
      res.cookie('nexus_rt', (result as any).refreshToken, REFRESH_COOKIE_OPTIONS);
    }
    res.status(201).json({ success: true, data: result });
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const input = VerifyEmailSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await AuthService.verifyEmail(input, getMeta(req));
    res.cookie('nexus_rt', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken, user } });
  }),

  resendCode: asyncHandler(async (req: Request, res: Response) => {
    const input = ResendCodeSchema.parse(req.body);
    const result = await AuthService.resendVerificationCode(input);
    res.json({ success: true, data: result });
  }),

  googleConfig: asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        configured: GoogleAuthService.isConfigured(),
        clientId: env.GOOGLE_CLIENT_ID || null,
        callbackUrl: env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback',
      },
    });
  }),

  googleAuthUrl: asyncHandler(async (req: Request, res: Response) => {
    const redirectUri = (req.query.redirectUri as string) || undefined;
    const url = GoogleAuthService.getAuthUrl(redirectUri);
    res.json({ success: true, data: { url } });
  }),

  googleLoginRedirect: asyncHandler(async (req: Request, res: Response) => {
    const redirectUri = (req.query.redirectUri as string) || undefined;
    const url = GoogleAuthService.getAuthUrl(redirectUri);
    res.redirect(url);
  }),

  googleCallback: asyncHandler(async (req: Request, res: Response) => {
    const error = req.query.error as string | undefined;
    if (error) {
      const errorMsg = req.query.error_description || error;
      const html = `<!DOCTYPE html>
<html>
<head><title>Google Sign-In Cancelled</title></head>
<body style="font-family: system-ui, sans-serif; background: #0F1117; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center; max-width: 420px; padding: 28px; border-radius: 12px; background: #161922; border: 1px solid #282D3D;">
    <h3 style="color: #F87171; margin: 0 0 10px; font-size: 18px;">Authentication Cancelled</h3>
    <p style="color: #9CA3AF; font-size: 14px; margin-bottom: 16px;">${errorMsg}</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: ${JSON.stringify(errorMsg)} }, '*');
        setTimeout(() => window.close(), 1200);
      } else {
        setTimeout(() => { window.location.href = '${env.CLIENT_URL}/login?error=' + encodeURIComponent(${JSON.stringify(errorMsg)}); }, 1200);
      }
    </script>
  </div>
</body>
</html>`;
      res.status(400).send(html);
      return;
    }

    const code = req.query.code as string | undefined;
    if (!code) {
      throw new AppError(400, 'Authorization code missing in Google callback.', 'MISSING_AUTH_CODE');
    }

    const { accessToken, refreshToken, user } = await AuthService.loginWithGoogle({ code }, getMeta(req));
    res.cookie('nexus_rt', refreshToken, REFRESH_COOKIE_OPTIONS);

    const clientAppUrl = `${env.CLIENT_URL}/app`;
    const html = `<!DOCTYPE html>
<html>
<head><title>Authentication Successful</title></head>
<body style="font-family: system-ui, sans-serif; background: #0F1117; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center; max-width: 420px; padding: 32px; border-radius: 12px; background: #161922; border: 1px solid #282D3D; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="width: 48px; height: 48px; border-radius: 50%; background: #10B981; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h2 style="font-size: 18px; margin: 0 0 8px; color: #fff;">Signed in with Google</h2>
    <p style="color: #9CA3AF; font-size: 14px; margin: 0;">Welcome, ${user.firstName}. Redirecting to your workspace...</p>
    <script>
      const authData = {
        type: 'GOOGLE_AUTH_SUCCESS',
        accessToken: ${JSON.stringify(accessToken)},
        user: ${JSON.stringify(user)}
      };
      if (window.opener) {
        window.opener.postMessage(authData, '*');
        setTimeout(() => window.close(), 500);
      } else {
        localStorage.setItem('nexus_direct_token', ${JSON.stringify(accessToken)});
        window.location.href = '${clientAppUrl}';
      }
    </script>
  </div>
</body>
</html>`;
    res.send(html);
  }),

  googleAuth: asyncHandler(async (req: Request, res: Response) => {
    const input = GoogleAuthSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await AuthService.loginWithGoogle(input, getMeta(req));
    res.cookie('nexus_rt', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken, user } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = LoginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await AuthService.login(input, getMeta(req));
    res.cookie('nexus_rt', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken, user } });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawRefreshToken = req.cookies?.nexus_rt as string | undefined;
    if (!rawRefreshToken) throw new AppError(401, 'No refresh token provided.', 'REFRESH_MISSING');
    const { accessToken, refreshToken } = await AuthService.refresh(rawRefreshToken, getMeta(req));
    res.cookie('nexus_rt', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken } });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawRefreshToken = req.cookies?.nexus_rt as string | undefined;
    await AuthService.logout(req.user!.sub, rawRefreshToken);
    res.clearCookie('nexus_rt', { path: '/api/v1/auth' });
    res.json({ success: true, data: null, message: 'Logged out successfully.' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserRepository.findById(req.user!.sub);
    if (!user) throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
    res.json({ success: true, data: user });
  }),
};
