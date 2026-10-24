import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new organization and admin user (dispatches verification email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify 6-digit confirmation code and activate organization workspace
 */
router.post('/verify-email', AuthController.verifyEmail);

/**
 * @swagger
 * /auth/resend-code:
 *   post:
 *     tags: [Auth]
 *     summary: Resend 6-digit verification code to registered email
 */
router.post('/resend-code', AuthController.resendCode);

/**
 * @swagger
 * /auth/google/config:
 *   get:
 *     tags: [Auth]
 *     summary: Get Google OAuth client configuration status
 */
router.get('/google/config', AuthController.googleConfig);

/**
 * @swagger
 * /auth/google/url:
 *   get:
 *     tags: [Auth]
 *     summary: Generate authentic Google OAuth authorization URL
 */
router.get('/google/url', AuthController.googleAuthUrl);

/**
 * @swagger
 * /auth/google/login:
 *   get:
 *     tags: [Auth]
 *     summary: Direct browser redirect to Google OAuth login flow
 */
router.get('/google/login', AuthController.googleLoginRedirect);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth 2.0 authorization code callback
 */
router.get('/google/callback', AuthController.googleCallback);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Google OAuth sign-in & sign-up via verified token or auth code
 */
router.post('/google', AuthController.googleAuth);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login — returns access token, sets httpOnly refresh cookie
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token — requires nexus_rt cookie
 */
router.post('/refresh', AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — invalidates current refresh token
 *     security:
 *       - BearerAuth: []
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - BearerAuth: []
 */
router.get('/me', authenticate, AuthController.me);

export default router;
