import { db } from "@/lib/db";
import { parseImages } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse all products",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; sort?: string; page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { archived: false };
  if (searchParams.category) {
    where.category = { slug: searchParams.category };
  }
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: Record<string, any> = { createdAt: "desc" };
  if (searchParams.sort === "price-asc") orderBy = { price: "asc" };
  if (searchParams.sort === "price-desc") orderBy = { price: "desc" };
  if (searchParams.sort === "name") orderBy = { name: "asc" };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        attributes: {
          where: { definition: { showOnCard: true } },
          include: { definition: true },
          orderBy: { definition: { sortOrder: "asc" } },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="mt-2 text-muted-foreground">
          {total} product{total !== 1 ? "s" : ""} found
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">No products found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {products.map((product: any) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              compareAt={product.compareAt}
              images={parseImages(product.images)}
              category={product.category?.name}
              featured={product.featured}
              specs={
                product.attributes?.map((attr: any) => ({
                  name: attr.definition.name,
                  value: attr.value,
                  unit: attr.definition.unit,
                  type: attr.definition.type,
                })) ?? []
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/products?page=${p}${searchParams.category ? `&category=${searchParams.category}` : ""}${searchParams.search ? `&search=${searchParams.search}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                p === page ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
