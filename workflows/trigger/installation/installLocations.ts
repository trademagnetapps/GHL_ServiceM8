import { envvars, logger, task } from "@trigger.dev/sdk/v3";

import { installLocation } from "./installLocation";

// PAYLOAD TYPE

interface Company {
  company_id: string;
  access_token: string;
}

export const installLocations = task({
  id: "install-locations",

  onStart: async (payload: Company, { ctx }) => {
    logger.log("Starting install locations", { payload });
  },

  run: async (payload: Company, { ctx }) => {
    // GET INSTALLED LOCATIONS

    const appId = await envvars.retrieve("GHL_APP_ID");

    const installedLocations: InstalledLocations = await logger.trace(
      "Get installed locations",
      async (span) => {
        const url =
          "https://services.leadconnectorhq.com/oauth/installedLocations?companyId=" +
          payload.company_id + "&appId=" +
          appId.value + "&limit=1000&isInstalled=true";
        const options = {
          method: "GET",
          headers: {
            Version: "2021-07-28",
            Accept: "application/json",
            Authorization: "Bearer " + payload.access_token,
          },
        };

        const response = await fetch(url, options);
        const data = await response.json();
        logger.log("Fetch response", data);

        return {
          locations: data.locations.map((location: any) => ({
            location_id: location._id,
            street_address: location.street_address,
            name: location.name,
          })),
        };
      },
    );

    interface InstalledLocations {
      locations: InstalledLocation[];
    }

    interface InstalledLocation {
      location_id: string;
      street_address: string;
      name: string;
    }

    // CHUNK ARRAY FUNCTION

    function chunkArray<T>(array: T[], chunkSize: number): T[][] {
      const chunks: T[][] = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
      }
      return chunks;
    }

    // RUN INSTALL LOCATION TASK

    const chunkSize = 100; // Maximum number of items per batch
    const locationChunks = chunkArray(installedLocations.locations, chunkSize);

    for (const chunk of locationChunks) {
      await installLocation.batchTrigger(
        chunk.map((location) => ({
          payload: {
            company_id: payload.company_id,
            location_id: location.location_id,
            access_token: payload.access_token,
          },
        })),
      );
    }
  },

  onSuccess: async (payload: Company, output, { ctx }) => {
    logger.log("Install locations completed", { output });
  },
});
