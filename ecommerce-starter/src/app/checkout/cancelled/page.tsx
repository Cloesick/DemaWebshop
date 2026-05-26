import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelledPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <XCircle className="mx-auto h-16 w-16 text-destructive" />
      <h1 className="mt-6 text-3xl font-bold">Order Cancelled</h1>
      <p className="mt-4 text-muted-foreground">
        Your order has been cancelled. No charges have been made.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/products">
          <Button size="lg">Back to Products</Button>
        </Link>
      </div>
    </div>
  );
}
