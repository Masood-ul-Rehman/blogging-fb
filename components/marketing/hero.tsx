import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Hero() {
  return (
    <section className="container mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-20">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <Card className="aspect-[16/10] md:order-1">
          <Image
            src={
              "/placeholder.svg?height=500&width=800&query=analytics+dashboard+preview"
            }
            alt="Product preview"
            width={800}
            height={500}
            className="h-full w-full rounded-md object-cover"
          />
        </Card>
        <div className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
            Get to know your customers with forms worth filling out
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Collect the data you need to understand customers and turn insights
            into action. Build forms, organize content, and visualize content
            metrics in minutes.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild size="lg">
              <Link href="/app">Get started — it’s free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
