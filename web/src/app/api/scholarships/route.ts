import { NextRequest, NextResponse } from 'next/server';
import catalogJson from '../../../../fixtures/p7/student-catalog.json';
import matrixCatalogJson from '../../../../fixtures/p7/matrix-catalog.json';
import legacyApiDataJson from '../../../../fixtures/p7/legacy-api-data.json';
import { StudentCatalogSchema } from '@/lib/studentCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const catalog = StudentCatalogSchema.parse(catalogJson);
const matrixCatalog = StudentCatalogSchema.parse(matrixCatalogJson);

export async function GET(request: NextRequest) {
  const useMatrixFixture = process.env.NODE_ENV !== 'production' && request.nextUrl.searchParams.get('qa') === 'matrix';
  const selectedCatalog = useMatrixFixture ? matrixCatalog : catalog;
  return NextResponse.json({
    schemaVersion: '2.0.0',
    catalog: selectedCatalog,
    data: legacyApiDataJson,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
