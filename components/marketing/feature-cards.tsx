import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const features = [
  {
    title: "Secure authentication",
    desc: "Clerk-powered auth with sign up, sign in, and password reset.",
  },
  {
    title: "Content management",
    desc: "Upload, tag, and search content instantly.",
  },
  {
    title: "Content analytics",
    desc: "Track content metrics and see them visualized clearly.",
  },
];

export function FeatureCards() {
  return (
    <div id="features" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <Card key={f.title}>
          <CardHeader>
            <CardTitle>{f.title}</CardTitle>
            <CardDescription>{f.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-24 rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
