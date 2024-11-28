import {
  envvars,
  idempotencyKeys,
  logger,
  tags,
  task,
} from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

export const servicem8Installation = task({
  id: "servicem8-installation",

  run: async (payload: { code: string, redirect_uri: string, location_id: string }, { ctx }) => {

    // ---
    // #region // CREATE SUPABASE CLIENT

    const supabaseUrl = await envvars.retrieve("SUPABASE_PROJECT_URL");
    const supabaseKey = await envvars.retrieve("SUPABASE_SERVICE_KEY");
    const supabase = createClient(supabaseUrl.value, supabaseKey.value);

    // #endregion
    // ---

    // ---
    // #region // GET ACCESS CREDENTIALS

    const clientId = await envvars.retrieve("SERVICE_M8_APP_ID");
    const clientSecret = await envvars.retrieve("SERVICE_M8_APP_SECRET");

    const tokenResponse = await fetch("https://go.servicem8.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId.value,
        client_secret: clientSecret.value,
        code: payload.code,
        redirect_uri: payload.redirect_uri,
      }),
    });

    const accessData = await tokenResponse.json();

    // #endregion
    // ---

    // ---
    // #region // UPDATE LOCATION WITH CREDENTIALS

    const { data, error } = await supabase
      .from("locations")
      .update({
        sm8_access: accessData.access_token,
        sm8_refresh: accessData.refresh_token,
      })
      .eq("location_id", payload.location_id);

    if (error) {
      throw new Error(`Failed to upsert credentials: ${error.message}`);
    }

    // #endregion
    // ---

    // ---
    // #region // SUBSCRIBE TO WEBHOOKS

    const callback = `https://ffd4-2601-603-4800-fc70-81f6-b3e4-f8a-873f.ngrok-free.app/webhooks/servicem8`

    const response = await fetch(`https://api.servicem8.com/webhook_subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${accessData.access_token}`,
      },
      body: new URLSearchParams({
        object: "Client", // Company
        fields: "contact_create,install",
        callback_url: callback,
      }).toString(),
    });

    const responseBody = await response.json();
    logger.log("Webhook subscription response:", responseBody);

    if (!response.ok) {
      throw new Error(`Failed to subscribe to webhooks: ${response.statusText}`);
    }

    // #endregion
    // ---

  },
});
