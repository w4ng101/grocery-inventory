import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateTokens, verifyRefreshToken } from '@/lib/auth/jwt';
import type { LoginDto, User, AuthTokens, JwtPayload } from '@/types';

export class AuthService {
  /**
   * Authenticate a user and return JWT tokens.
   * Uses service role key → direct table query, bypasses RLS and schema cache entirely.
   */
  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const email = dto.email.toLowerCase().trim();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active, password_hash, last_login, created_at, updated_at')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      // Surface real DB errors (schema not set up, table missing, etc.)
      if (error.code === 'PGRST116') {
        // No rows found = wrong credentials
        throw new Error('Invalid email or password');
      }
      throw new Error(`Database error: ${error.message} (code: ${error.code})`);
    }
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Verify password against bcrypt hash
    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 4. Generate tokens
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      full_name: user.full_name,
    };

    const tokens = await generateTokens(payload);
    return { user: user as unknown as User, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const decoded = await verifyRefreshToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      throw new Error('User not found or inactive');
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    return await generateTokens(payload);
  }

  /**
   * Register a new user (admin action)
   */
  async register(dto: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }): Promise<User> {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? 'Failed to create user');
    }

    // Create user profile
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email: dto.email.toLowerCase().trim(),
        full_name: dto.full_name,
        role: dto.role,
      })
      .select()
      .single();

    if (error || !user) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(error?.message ?? 'Failed to create user profile');
    }

    return user as User;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  }

  /**
   * Change password
   */
  async changePassword(authId: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authId, {
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  }
}

export const authService = new AuthService();

