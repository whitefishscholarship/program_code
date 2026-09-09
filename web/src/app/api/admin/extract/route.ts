import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json(
    {
      error: 'Production ingestion is retired. The deployed application uses reviewed immutable publication bytes only.',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
