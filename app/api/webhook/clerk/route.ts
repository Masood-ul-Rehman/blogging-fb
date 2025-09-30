import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    public_metadata?: {
      role?: string;
    };
  };
};

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const { type, data } = evt;
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address || "";
  const name =
    data.first_name && data.last_name
      ? `${data.first_name} ${data.last_name}`.trim()
      : data.first_name || data.last_name || email.split("@")[0];
  const role = data.public_metadata?.role || "user";

  try {
    switch (type) {
      case "user.created":
        console.log(`User created: ${userId}`);
        await convex.mutation(api.users.create, {
          userId,
          name,
          email,
          role,
        });
        break;

      case "user.updated":
        console.log(`User updated: ${userId}`);
        await convex.mutation(api.users.updateUser, {
          userId,
          name,
          email,
          role,
        });
        break;

      case "user.deleted":
        console.log(`User deleted: ${userId}`);
        await convex.mutation(api.users.deleteUser, {
          userId,
        });
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook ${type}:`, error);
    return new NextResponse("Error processing webhook", {
      status: 500,
    });
  }

  return new NextResponse("", { status: 200 });
}
