import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

type CardSpec = {
  name: string;
  value: string;
  unit?: string | null;
  type: string;
};

type ProductCardProps = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAt?: number | null;
  images: string[];
  category?: string | null;
  featured?: boolean;
  specs?: CardSpec[];
};

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAt,
  images,
  category,
  featured,
  specs,
}: ProductCardProps) {
  const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
      {/* Image */}
      <Link href={`/products/${slug}`} className="relative aspect-square overflow-hidden">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {featured && <Badge>Featured</Badge>}
          {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {category && <p className="text-xs text-muted-foreground mb-1">{category}</p>}
        <Link href={`/products/${slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:underline">{name}</h3>
        </Link>

        {/* PIM Specs */}
        {specs && specs.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {specs.map((spec) => (
              <span
                key={spec.name}
                className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                title={spec.name}
              >
                {spec.type === "COLOR" ? (
                  <>
                    <span
                      className="mr-1 inline-block h-2 w-2 rounded-full border"
                      style={{ backgroundColor: spec.value }}
                    />
                    {spec.value}
                  </>
                ) : (
                  <>
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ""}
                  </>
                )}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{formatPrice(price)}</span>
            {compareAt && compareAt > price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(compareAt)}
              </span>
            )}
          </div>
          <Button size="icon" variant="outline" className="h-8 w-8">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
