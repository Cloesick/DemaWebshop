import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice, parseImages } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AddToCartButton } from "./add-to-cart-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
  });
  if (!product) return { title: "Not Found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      variants: true,
      reviews: { include: { user: { select: { name: true, image: true } } } },
    },
  });

  if (!product) notFound();

  const images = parseImages(product.images);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((img: string, i: number) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {product.category && (
            <Badge variant="secondary">{product.category.name}</Badge>
          )}

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {avgRating > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
              </span>
              <span>({product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""})</span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compareAt && product.compareAt > product.price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </div>

          {product.description && (
            <>
              <Separator />
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{product.description}</p>
              </div>
            </>
          )}

          {/* Variants */}
          {product.variants.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-3">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <Badge key={v.id} variant="outline" className="cursor-pointer hover:bg-accent">
                      {v.name} {v.stock > 0 ? "" : "(Out of stock)"}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          <AddToCartButton product={{ ...product, images }} />
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Reviews</h2>
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.user.name ?? "Anonymous"}</span>
                  <span className="text-sm text-muted-foreground">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.title && <h4 className="mt-2 font-medium">{review.title}</h4>}
                {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
