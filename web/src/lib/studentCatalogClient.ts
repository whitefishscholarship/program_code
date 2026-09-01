import { StudentCatalogSchema, type StudentCatalog } from './studentCatalog';

export type CatalogQaMode = 'matrix' | 'error' | null;

export async function loadStudentCatalog(qaMode: CatalogQaMode): Promise<StudentCatalog> {
  if (process.env.NODE_ENV !== 'production' && qaMode === 'error') {
    throw new Error('The scholarship catalog is temporarily unavailable.');
  }
  const endpoint = process.env.NODE_ENV !== 'production' && qaMode === 'matrix'
    ? '/api/scholarships?qa=matrix'
    : '/api/scholarships';
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('The scholarship catalog is temporarily unavailable.');
  const payload = await response.json() as { catalog?: unknown };
  return StudentCatalogSchema.parse(payload.catalog);
}
