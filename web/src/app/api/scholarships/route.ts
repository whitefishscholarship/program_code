import { NextRequest, NextResponse } from 'next/server';
import { R3_CATALOG } from '@/lib/r3Catalog';
import { catalogCompatibilityRows } from '@/lib/catalogCompatibility';
import matrixCatalogJson from '../../../../fixtures/p7/matrix-catalog.json';
import { StudentCatalogSchema } from '@/lib/studentCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const catalog = R3_CATALOG;
const matrixCatalog = StudentCatalogSchema.parse(matrixCatalogJson);

export async function GET(request: NextRequest) {
  const useMatrixFixture = process.env.NODE_ENV !== 'production' && request.nextUrl.searchParams.get('qa') === 'matrix';
  const selectedCatalog = useMatrixFixture ? matrixCatalog : catalog;
  return NextResponse.json({
    schemaVersion: '2.0.0',
    catalog: selectedCatalog,
    data: catalogCompatibilityRows(selectedCatalog),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
