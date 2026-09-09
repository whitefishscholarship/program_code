import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json(
    {
      error: 'Production scholarship writes are retired. The deployed application is read-only.',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
