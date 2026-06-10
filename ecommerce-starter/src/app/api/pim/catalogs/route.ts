import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const catalogs = await db.catalog.findMany({
      where: { isActive: true },
      include: {
        productTypes: {
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(catalogs);
  } catch (error) {
    console.error("[PIM_CATALOGS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch catalogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, sector } = body;

    if (!name || !slug || !sector) {
      return NextResponse.json({ error: "name, slug, and sector are required" }, { status: 400 });
    }

    const catalog = await db.catalog.create({
      data: { name, slug, description, sector },
    });

    return NextResponse.json(catalog, { status: 201 });
  } catch (error) {
    console.error("[PIM_CATALOGS_POST]", error);
    return NextResponse.json({ error: "Failed to create catalog" }, { status: 500 });
  }
}
