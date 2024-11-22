import { envvars, logger, tags, task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

// Payload type
interface BaseLocation {
  company_id: string;
  location_id: string;
}

interface DirectLocation extends BaseLocation {
  access_token: string;
  webhook?: never;
}

interface WebhookLocation extends BaseLocation {
  webhook: true;
  access_token?: never;
}

type LocationInstall = DirectLocation | WebhookLocation;

export const installLocation = task({
  id: "install-location",

  run: async (payload: LocationInstall, { ctx }) => {
    // CREATE SUPABASE CLIENT

    const supabaseUrl = await envvars.retrieve("SUPABASE_PROJECT_URL");
    const supabaseKey = await envvars.retrieve("SUPABASE_SERVICE_KEY");
    const supabase = createClient(supabaseUrl.value, supabaseKey.value);

    if (payload.webhook && payload.location_id) {
      // This fires if we get an install webhook
      // 2 possible actions:
      // 1. New location created for existing company
      // 2. New location created for new company
      // Need to know if this is a new company or existing company
      logger.log("Checking if company exists", { company_id: payload.company_id, location_id: payload.location_id });
      const { data: companyAccessData, error: companyAccessError } = await supabase
        .from("companies")
        .select("access_token")
        .eq("company_id", payload.company_id)
        .single();

      if (companyAccessError) {
        throw new Error(`Failed to get company access: ${companyAccessError.message}`);
      } else {
        payload.access_token = companyAccessData.access_token;
      }
    }

    // GET LOCATION ACCESS

    const locationAccess: LocationAccess = await logger.trace(
      "Get location access",
      async (span) => {
        const url = "https://services.leadconnectorhq.com/oauth/locationToken";
        const options = {
          method: "POST",
          headers: {
            Version: "2021-07-28",
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            Authorization: "Bearer " + payload.access_token,
          },
          body: new URLSearchParams({
            companyId: payload.company_id,
            locationId: payload.location_id,
          }),
        };

        const response = await fetch(url, options);
        const data = await response.json();
        logger.log("Fetch response", data);

        const expires_at = Math.floor(Date.now() / 1000) + data.expires_in;

        return {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: expires_at,
        };
      },
    );

    interface LocationAccess {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    }

    // UPSERT LOCATION TO DATABASE

    logger.log("Upserting location", { locationAccess });

    const { error } = await supabase
      .from("locations")
      .upsert({
        location_id: payload.location_id,
        company_id: payload.company_id,
        access_token: locationAccess.access_token,
        refresh_token: locationAccess.refresh_token,
        expires_at: locationAccess.expires_at,
      });

    if (error) {
      throw new Error(`Failed to upsert location: ${error.message}`);
    }

    return { locationAccess };
  },

  onSuccess: async (payload, output, { ctx }) => {
    logger.log("Install locations completed", { output });
  },
});
