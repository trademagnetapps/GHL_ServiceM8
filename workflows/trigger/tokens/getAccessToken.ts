import { envvars, logger, tags, task } from "@trigger.dev/sdk/v3";

interface Credentials {
  code: string | null;
  refresh_token: string | null;
  user_type: string;
}

export interface NewTokens {
  company_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

export const getAccessToken = task({
  id: "get-access-token",

  run: async (payload: Credentials, { ctx }) => {
    logger.log("Getting access credentials", { payload });
    await tags.add(payload.user_type);

    const clientId = await envvars.retrieve("GHL_CLIENT_ID");
    const clientSecret = await envvars.retrieve("GHL_CLIENT_SECRET");

    const url = "https://services.leadconnectorhq.com/oauth/token";
    const bodyParams: Record<string, string> = {
      client_id: clientId.value,
      client_secret: clientSecret.value,
    };

    if (payload.code) {
      bodyParams.grant_type = "authorization_code";
      bodyParams.code = payload.code;
    } else if (payload.refresh_token) {
      bodyParams.grant_type = "refresh_token";
      bodyParams.refresh_token = payload.refresh_token;
    } else {
      throw new Error("Neither code nor refresh_token provided");
    }

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams(bodyParams),
    };

    // Fetching and formatting response
    const response = await fetch(url, options);
    const data = await response.json();
    logger.log("Fetch response", data);

    const expires_at = Math.floor(Date.now() / 1000) + data.expires_in;

    const newTokens: NewTokens = {
      company_id: data.companyId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expires_at,
      user_id: data.userId,
    };

    // Return company information
    return newTokens;
  },
});
