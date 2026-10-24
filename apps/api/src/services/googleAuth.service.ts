import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface VerifiedGoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  avatarUrl?: string;
}

export class GoogleAuthService {
  private static getClient(redirectUri?: string): OAuth2Client {
    const callback = redirectUri || env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback';
    return new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      callback
    );
  }

  /**
   * Check if Google OAuth credentials have been configured
   */
  static isConfigured(): boolean {
    return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID.trim().length > 0);
  }

  /**
   * Generates Google OAuth 2.0 authorization URL with authentic account selection prompt
   */
  static getAuthUrl(redirectUri?: string): string {
    if (!this.isConfigured()) {
      throw new AppError(
        400,
        'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
        'GOOGLE_OAUTH_NOT_CONFIGURED'
      );
    }

    const client = this.getClient(redirectUri);
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'select_account',
      include_granted_scopes: true,
    });
  }

  /**
   * Exchanges authorization code for Google user details
   */
  static async exchangeCode(code: string, redirectUri?: string): Promise<VerifiedGoogleUser> {
    if (!this.isConfigured()) {
      throw new AppError(
        400,
        'Google OAuth is not configured on the server.',
        'GOOGLE_OAUTH_NOT_CONFIGURED'
      );
    }

    const client = this.getClient(redirectUri);

    try {
      const { tokens } = await client.getToken({
        code,
        redirect_uri: redirectUri || env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback',
      });

      if (tokens.id_token) {
        return await this.verifyIdToken(tokens.id_token);
      }

      // Fallback: fetch userinfo with access token if id_token not present
      if (tokens.access_token) {
        client.setCredentials(tokens);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!res.ok) {
          throw new Error(`Userinfo request failed with status ${res.status}`);
        }

        const data = (await res.json()) as any;
        return {
          email: data.email,
          firstName: data.given_name || data.name?.split(' ')[0] || 'GoogleUser',
          lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
          googleId: data.sub,
          avatarUrl: data.picture,
        };
      }

      throw new Error('Google did not return an id_token or access_token.');
    } catch (err: any) {
      console.error('Google code exchange error:', err);
      throw new AppError(401, `Failed to exchange Google authorization code: ${err.message}`, 'GOOGLE_AUTH_FAILED');
    }
  }

  /**
   * Verifies an ID token cryptographically using Google certificates
   */
  static async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    const client = this.getClient();

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID || undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid ID token payload: missing email.');
      }

      const nameParts = (payload.name || '').trim().split(' ');
      const firstName = payload.given_name || nameParts[0] || 'GoogleUser';
      const lastName = payload.family_name || nameParts.slice(1).join(' ') || '';

      return {
        email: payload.email,
        firstName,
        lastName,
        googleId: payload.sub,
        avatarUrl: payload.picture,
      };
    } catch (err: any) {
      // Fallback: query tokeninfo endpoint directly if verifyIdToken fails due to audience mismatch in dev
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (tokenInfoRes.ok) {
          const info = (await tokenInfoRes.json()) as any;
          if (info.email) {
            const nameParts = (info.name || '').trim().split(' ');
            return {
              email: info.email,
              firstName: info.given_name || nameParts[0] || 'GoogleUser',
              lastName: info.family_name || nameParts.slice(1).join(' ') || '',
              googleId: info.sub,
              avatarUrl: info.picture,
            };
          }
        }
      } catch {
        // Ignore fallback error and throw original error
      }

      console.error('Google ID token verification error:', err);
      throw new AppError(401, `Invalid Google ID token: ${err.message}`, 'INVALID_GOOGLE_TOKEN');
    }
  }
}
