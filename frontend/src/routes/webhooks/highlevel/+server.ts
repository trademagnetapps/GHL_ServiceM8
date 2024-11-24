import { json } from '@sveltejs/kit';
import { TRIGGER_API_KEY } from "$env/static/private";

if (!TRIGGER_API_KEY) {
  throw new Error("TRIGGER_API_KEY is not set");
}

interface TriggerOptions {
  queue?: {
    name: string;
    concurrencyLimit?: number;
  };
  idempotencyKey?: string;
  concurrencyKey?: string;
}

async function trigger(
  taskIdentifier: string,
  payload: any,
  options?: TriggerOptions,
) {
  const requestBody: any = { payload };

  if (options?.queue) {
    requestBody.queue = options.queue;
  }
  if (options?.idempotencyKey) {
    requestBody.idempotencyKey = options.idempotencyKey;
  }
  if (options?.concurrencyKey) {
    requestBody.concurrencyKey = options.concurrencyKey;
  }

  const response = await fetch(
    `https://api.trigger.dev/api/v1/tasks/${taskIdentifier}/trigger`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TRIGGER_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger task ${taskIdentifier}: ${errorText}`);
  }
}

export async function POST({ request, cookies }) {
  const body = await request.json();
  console.log("Event received:", body);

  try {
    switch (body.type.toUpperCase()) {
      case "CONTACTCREATE":
        await trigger("contact-create", body);
        break;
      case "INSTALL":
        // We only want location installs
        if (body.locationId) {
          await trigger("install-location", {
            location_id: body.locationId,
            company_id: body.companyId,
            webhook: true,
          });
        }
        break;
      default:
        console.warn("Invalid event type", body);
    }

    return new Response("Event received", { status: 200 });
  } catch (error) {
    console.error("Error processing event:", error);
    // Return a 500 Internal Server Error response with no content
    return new Response(null, { status: 500 });
  }
  return new Response("Event received", { status: 200 });
}
