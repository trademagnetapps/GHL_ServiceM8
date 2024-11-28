import { SERVICE_M8_APP_ID, TRIGGER_API_KEY } from '$env/static/private';

export function load({ params, url }) {
	// Fire and forget - trigger installation in background
	triggerInstallation(url.searchParams.get('code'), url.origin, params.location).catch(err => {
		console.error('Installation failed:', err);
	});

	return {
		location: params.location,
		origin: url.origin,
		code: url.searchParams.get('code'),
		client: SERVICE_M8_APP_ID
	};
}

async function triggerInstallation(code: string | null, origin: string, location: string) {
	if (!code) return;

    console.log(`Triggering installation workflow for ${location}...`);
	
    // Triggers installation workflow
	const response = await fetch(`https://api.trigger.dev/api/v1/tasks/servicem8-installation/trigger`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${TRIGGER_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			payload: { code, redirect_uri: `${origin}/${location}/callback`, location_id: location },
			options: { idempotencyKey: code }
		})
	});

	if (!response.ok) {
        const errorText = await response.text();
		throw new Error(`Failed to trigger task ${errorText}`);
	} else {
		console.log(`Installation workflow triggered for ${location}`);
	}
}
