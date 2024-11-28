import { SERVICE_M8_APP_ID } from '$env/static/private';

export function load({ params, url }) {
	return {
		location: params.location,
		origin: url.origin,
		client: SERVICE_M8_APP_ID
	};
}