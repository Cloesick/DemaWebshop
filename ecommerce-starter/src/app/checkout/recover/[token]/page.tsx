"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart, AlertCircle, Loader2 } from "lucide-react";

interface RecoveredItem {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function RecoverCartPage() {
  const params = useParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [items, setItems] = useState<RecoveredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    async function recover() {
      try {
        const res = await fetch(`/api/abandoned-carts/recover/${params.token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to recover cart");
          return;
        }
        const data = await res.json();
        setItems(data.items);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    recover();
  }, [params.token]);

  const handleRestore = () => {
    for (const item of items) {
      addItem({
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: item.name,
        price: item.price,
        image: item.image ?? "",
        variantName: null,
      });
    }
    setRestored(true);
    setTimeout(() => router.push("/products"), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Unable to Recover Cart</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => router.push("/products")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (restored) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">Cart Restored!</h1>
        <p className="mt-2 text-muted-foreground">
          Your {items.length} item(s) have been added back to your cart. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Welcome Back!</h1>
        <p className="mt-2 text-muted-foreground">
          You left some items in your cart. Would you like to pick up where you left off?
        </p>
      </div>

      <div className="mt-8 space-y-3 rounded-lg border p-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <p className="font-medium">€{((item.price * item.quantity) / 100).toFixed(2)}</p>
          </div>
        ))}
        <div className="border-t pt-3">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>
              €{(items.reduce((sum, item) => sum + item.price * item.quantity, 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.push("/products")}>
          No Thanks
        </Button>
        <Button className="flex-1" onClick={handleRestore}>
          Restore My Cart
        </Button>
      </div>
    </div>
  );
}
