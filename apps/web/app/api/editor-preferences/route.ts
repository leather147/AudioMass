import { NextResponse } from 'next/server';

import { isEditorPreferences } from '@/lib/editor-preferences';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!isEditorPreferences(payload)) {
    return NextResponse.json({ error: 'Unsupported editor preferences' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const cookieOptions = {
    httpOnly: true,
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  response.cookies.set('am-locale', payload.locale, cookieOptions);
  response.cookies.set('am-theme', payload.theme, cookieOptions);
  return response;
}
