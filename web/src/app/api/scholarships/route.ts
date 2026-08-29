import { NextResponse } from 'next/server';
import catalogJson from '../../../../fixtures/p7/student-catalog.json';
import { StudentCatalogSchema } from '@/lib/studentCatalog';

export const dynamic = 'force-static';
export const revalidate = 300;

const catalog = StudentCatalogSchema.parse(catalogJson);

export async function GET() {
  return NextResponse.json(catalog, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
