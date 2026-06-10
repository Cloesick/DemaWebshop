import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function PublishedPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await db.page.findUnique({
    where: { slug: params.slug },
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return (
    <>
      {page.gjsCss && (
        <style dangerouslySetInnerHTML={{ __html: page.gjsCss }} />
      )}
      <div dangerouslySetInnerHTML={{ __html: page.gjsHtml }} />
    </>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const page = await db.page.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true },
  });

  if (!page) return { title: "Not Found" };

  return {
    title: page.title,
    description: page.description,
  };
}
