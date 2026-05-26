import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, ShieldCheck, Truck } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Modern E-Commerce
              <span className="block text-primary/80">Starter Template</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              A production-ready Next.js e-commerce framework with authentication,
              payments, cart management, and a beautiful UI. Built with TypeScript,
              Tailwind CSS, Prisma, and Stripe.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/products">
                <Button size="lg">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg">
                  View Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <Truck className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold">Fast Shipping</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Free shipping on orders over &euro;50. Delivery within 2-5 business days.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <ShieldCheck className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold">Secure Payments</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Powered by Stripe. Your payment information is always protected.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <Package className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold">Easy Returns</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                30-day return policy. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            This starter includes everything you need: product catalog, cart,
            checkout, authentication, and admin capabilities.
          </p>
          <div className="mt-8">
            <Link href="/products">
              <Button size="lg">
                Explore the Store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
