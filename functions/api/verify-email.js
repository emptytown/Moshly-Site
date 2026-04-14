import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { corsOptionsResponse } from './_cors';
import { sha256Hex } from './_email_utils';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'missing_token',
        message: 'Verification token is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenHash = await sha256Hex(token);

    const user = await db.select()
      .from(schema.users)
      .where(eq(schema.users.verificationToken, tokenHash))
      .get();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'invalid_token',
        message: 'Invalid or expired verification token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    if (user.verificationExpires && user.verificationExpires < now) {
      return new Response(JSON.stringify({ 
        error: 'token_expired',
        message: 'Verification token has expired. Please try logging in to receive a new one.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.update(schema.users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null
      })
      .where(eq(schema.users.id, user.id))
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error during verification' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
