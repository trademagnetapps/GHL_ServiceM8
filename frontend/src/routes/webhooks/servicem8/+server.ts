import { json } from '@sveltejs/kit';
import { TRIGGER_API_KEY } from "$env/static/private";

if (!TRIGGER_API_KEY) throw new Error("TRIGGER_API_KEY is not set")

// Webhook endpoint verification for subscribing to webhooks
export async function GET({ request, cookies }) {
    const body = await request.json();
    console.log("Verification request:", body);
    return new Response(body.challenge, { status: 200 });
}

// Webhook endpoint for receiving webhooks
export async function POST({ request, cookies }) {
    const body = await request.json();
    console.log("Event received:", body);
    return new Response("Event received", { status: 200 });
}