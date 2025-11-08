import { NextResponse } from 'next/server';
import { getPdfsByCategory } from '@/lib/pdfCatalog';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = (params?.slug ?? '').toString();
    if (!slug) return NextResponse.json({ pdfs: [] }, { status: 200 });
    const pdfs = await getPdfsByCategory(slug);
    return NextResponse.json({ pdfs }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ pdfs: [] }, { status: 200 });
  }
}
