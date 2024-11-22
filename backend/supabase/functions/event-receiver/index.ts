// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const triggerApiKey = Deno.env.get("TRIGGER_API_KEY");

if (!triggerApiKey) {
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
        "Authorization": `Bearer ${triggerApiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger task ${taskIdentifier}: ${errorText}`);
  }
}

Deno.serve(async (req: Request) => {
  const body = await req.json();
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
      // case "OUTBOUNDMESSAGE":
      // case "INBOUNDMESSAGE":
      //   switch (body.messageType.toUpperCase()) {
      //     case "CALL":
      //       await trigger("call-recording", body);
      //       break;
      //     case "SMS":
      //       await trigger("text-message", body);
      //       break;
      //     case "EMAIL":
      //       await trigger("email-message", body);
      //       break;
      //     case "VOICEMAIL":
      //       await trigger("vm-recording", body);
      //       break;
      //     case "FB":
      //       await trigger("social-message", body);
      //       break;
      //     case "IG":
      //       await trigger("social-message", body);
      //       break;
      //     default:
      //       console.warn("Invalid message type", body);
      //   }
      //   break;
      default:
        console.warn("Invalid event type", body);
    }
  } catch (error) {
    console.error("Error processing event:", error);
    // Return a 500 Internal Server Error response with no content
    return new Response(null, { status: 500 });
  }
  return new Response("Event received", { status: 200 });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/eventReceiver' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
