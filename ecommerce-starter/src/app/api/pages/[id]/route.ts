import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const page = await db.page.findUnique({ where: { id: params.id } });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("[PAGE_GET]", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, slug, description, gjsData, gjsHtml, gjsCss, isPublished, isHomepage } = body;

    // If setting as homepage, unset other homepages first
    if (isHomepage) {
      await db.page.updateMany({
        where: { isHomepage: true, id: { not: params.id } },
        data: { isHomepage: false },
      });
    }

    const page = await db.page.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(gjsData !== undefined && { gjsData: typeof gjsData === "string" ? gjsData : JSON.stringify(gjsData) }),
        ...(gjsHtml !== undefined && { gjsHtml }),
        ...(gjsCss !== undefined && { gjsCss }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isHomepage !== undefined && { isHomepage }),
      },
    });

    return NextResponse.json(page);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[PAGE_PUT]", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.page.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[PAGE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
