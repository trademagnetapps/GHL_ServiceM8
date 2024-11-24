import { schedules, envvars, logger, task, tags } from "@trigger.dev/sdk/v3";
import { createClient } from '@supabase/supabase-js'

import { getAccessToken } from "./getAccessToken.ts";
import { NewTokens } from "./getAccessToken.ts";

export const refreshTokens = schedules.task({
  id: "refresh-tokens",
  cron: "0 * * * *", // every hour
  maxDuration: 120,
  run: async (payload) => {

    // CREATE SUPABASE CLIENT

    const supabaseUrl = await envvars.retrieve("SUPABASE_PROJECT_URL");
    const supabaseKey = await envvars.retrieve("SUPABASE_SERVICE_KEY");
    const supabase = createClient(supabaseUrl.value, supabaseKey.value);

    const twoHoursFromNow = Math.floor(Date.now() / 1000) + 2 * 60 * 60;

    type CompanyRow = { company_id: any; refresh_token: any; };
    type LocationRow = { location_id: any; refresh_token: any; };
    type TableRow = CompanyRow | LocationRow;

    // Function to refresh tokens for a specific table
    async function refreshTokensForTable(tableName: 'companies' | 'locations') {
      const idColumn = tableName === 'companies' ? 'company_id' : 'location_id';

      // Rows where expires_at is less than two hours from now
      // And also not null
      const { data, error } = await supabase
        .from(tableName)
        .select(`${idColumn}, refresh_token`)
        .lt('expires_at', twoHoursFromNow);

      if (error) {
        logger.error(`Error fetching ${tableName}:`, { error });
        return;
      }

      for (const row of data as TableRow[]) {
        const id = tableName === 'companies' ? (row as CompanyRow).company_id : (row as LocationRow).location_id;

        const newTokensResult = await getAccessToken.triggerAndWait({
          refresh_token: row.refresh_token,
          user_type: tableName === 'companies' ? 'Company' : 'Location',
          code: null
        });

        if (!newTokensResult.ok) {
          throw new Error(`Failed to get access token: ${newTokensResult.error}`);
        }
        const newTokens: NewTokens = newTokensResult.output;

        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
            expires_at: newTokens.expires_at
          })
          .eq(idColumn, id);

        if (updateError) {
          logger.error(`Error updating ${tableName}:`, { updateError });
          throw new Error(`Failed to update ${tableName}: ${updateError.message}`);
        } else {
          logger.info(`Successfully updated ${tableName} row:`, id);
        }
      }
    }

    // Refresh tokens for both tables
    await refreshTokensForTable('companies');
    await refreshTokensForTable('locations');

    logger.info("Token refresh process completed");
  },
});
