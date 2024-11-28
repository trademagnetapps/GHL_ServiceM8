<script lang="ts">
	const { data } = $props();
	const authURL = `https://go.servicem8.com/oauth/authorize
		?response_type=code
		&client_id=${data.client}
		&scope=manage_customers
		&redirect_uri=${encodeURIComponent(data.origin)}/${data.location}/callback`;
	// Redirects to /callback
</script>

<div class="min-h-screen p-4">
	<main
		class="flex min-h-[calc(100vh-2rem)] items-center justify-center rounded-3xl bg-gradient-to-br from-green-700 to-lime-500 p-4"
	>
		<div class="flex w-full max-w-lg flex-col items-center gap-8 rounded-lg bg-white p-8 shadow-lg">
			<h1 class="text-2xl font-bold">ServiceM8 Integration</h1>
			<p class="text-sm text-gray-500">Integrate your Trade Magnet account with ServiceM8.</p>
			<a href={authURL} target="_blank">
				<button class="rounded-md bg-blue-500 px-4 py-2 text-white">Connect account</button>
			</a>
		</div>
	</main>
</div>
