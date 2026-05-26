import { NextResponse } from "next/server";
import { getCatalogWithTypes } from "@/lib/pim";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const catalog = await getCatalogWithTypes(params.slug);

    if (!catalog) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    return NextResponse.json(catalog);
  } catch (error) {
    console.error("[PIM_CATALOG_GET]", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}
