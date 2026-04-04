import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { corsOptionsResponse } from './_cors';

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
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
      return new Response(JSON.stringify({ error: 'Invalid or expired verification token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.update(schema.users)
      .set({
        emailVerified: true,
        verificationToken: null
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
    return new Response(JSON.stringify({ error: 'Server error during verification' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
