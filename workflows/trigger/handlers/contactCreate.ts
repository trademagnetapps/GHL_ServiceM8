import { envvars, logger, tags, task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";

// Payload type
interface ContactCreate {
  locationId: string;
  id: string;
}

export const contactCreate = task({
  id: "contact-create",

  run: async (payload: ContactCreate, { ctx }) => {
    // CREATE SUPABASE CLIENT

    const supabaseUrl = await envvars.retrieve("SUPABASE_PROJECT_URL");
    const supabaseKey = await envvars.retrieve("SUPABASE_SERVICE_KEY");
    const supabase = createClient(supabaseUrl.value, supabaseKey.value);

    // GET LOCATION ACCESS

    const { data, error } = await supabase
      .from("locations")
      .select("access_token")
      .eq("location_id", payload.locationId)
      .single();

    if (error) {
      logger.error("Error fetching access token", { error });
      throw new Error("Failed to fetch access token");
    }

    if (!data || !data.access_token) {
      throw new Error("Access token not found for the given location");
    }

    const accessToken = data.access_token;
    logger.log("Access token retrieved", { accessToken });

    // GET CONTACT INFO

    // const { attributionSource, dateAdded, phone, firstName, lastName } =
    //   await logger.trace("Get contact info", async () => {
    //     const url = "https://services.leadconnectorhq.com/contacts/" +
    //       payload.id;
    //     const options = {
    //       method: "GET",
    //       headers: {
    //         Authorization: "Bearer " + accessToken,
    //         Version: "2021-07-28",
    //         Accept: "application/json",
    //       },
    //     };

    //     const response = await fetch(url, options);
    //     const data = await response.json();
    //     logger.log("Contact info response", data);

    //     return {
    //       attributionSource: data.contact?.attributionSource,
    //       dateAdded: data.contact?.dateAdded,
    //       phone: data.contact?.phone,
    //       firstName: data.contact?.firstName,
    //       lastName: data.contact?.lastName,
    //     };
    //   });

    // logger.log("Contact info", {
    //   attributionSource,
    //   dateAdded,
    //   phone,
    //   firstName,
    //   lastName,
    // });

    // INSERT CONTACT INTO DATABASE

    // await supabase.from("contacts").upsert({
    //   contact_id: payload.id,
    //   location_id: payload.locationId,
    //   created_at: dateAdded,
    //   attribution_source: attributionSource,
    //   phone: phone,
    //   name: firstName && lastName
    //     ? `${firstName} ${lastName}`
    //     : firstName
    //     ? firstName
    //     : lastName
    //     ? lastName
    //     : null,
    // });

    await supabase.from("contacts").upsert({
      contact_id: payload.id,
      location_id: payload.locationId,
    });
  },
});
