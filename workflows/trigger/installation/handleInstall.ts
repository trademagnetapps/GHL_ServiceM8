import {
  envvars,
  idempotencyKeys,
  logger,
  tags,
  task,
} from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

import { installLocations } from "./installLocations.ts";
import { getAccessToken } from "../tokens/getAccessToken.ts";

// Payload type
interface Install {
  code: string;
}

export const handleInstall = task({
  id: "handle-install",

  onStart: async (payload: Install, { ctx }) => {
    logger.log("Handling installation code", { payload });
  },

  run: async (payload: Install, { ctx }) => {
    // CREATE SUPABASE CLIENT

    const supabaseUrl = await envvars.retrieve("SUPABASE_PROJECT_URL");
    const supabaseKey = await envvars.retrieve("SUPABASE_SERVICE_KEY");
    const supabase = createClient(supabaseUrl.value, supabaseKey.value);

    // GET COMPANY ACCESS INFO

    const companyAccessResult = await getAccessToken.triggerAndWait({
      code: payload.code,
      refresh_token: null,
      user_type: "Company",
    });

    if (!companyAccessResult.ok) {
      throw new Error(
        `Failed to get access token: ${companyAccessResult.error}`,
      );
    }
    const companyAccess: CompanyAccess = companyAccessResult.output;

    interface CompanyAccess {
      company_id: string;
      access_token: string;
      refresh_token: string;
      expires_at: number;
      user_id: string;
    }

    // UPSERT COMPANY ROW

    await logger.trace("Upsert company row", async (span) => {
      const { error } = await supabase
        .from("companies")
        .upsert({
          company_id: companyAccess.company_id,
          access_token: companyAccess.access_token,
          expires_at: companyAccess.expires_at,
          refresh_token: companyAccess.refresh_token,
        });

      if (error) {
        throw new Error(`Failed to upsert company row: ${error.message}`);
      }
    });

    // TRIGGER CREATE LOCATIONS

    installLocations.trigger({
      company_id: companyAccess.company_id,
      access_token: companyAccess.access_token,
    });
  },
});
