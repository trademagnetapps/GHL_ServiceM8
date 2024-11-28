<script lang="ts">
	const { data } = $props();
	const authURL = `https://go.servicem8.com/oauth/authorize
		?response_type=code
		&client_id=${data.client}
		&scope=manage_customers
		&redirect_uri=${encodeURIComponent(data.origin)}/${data.location}/callback`;
</script>

<div class="min-h-screen p-4">
	<main
		class="flex min-h-[calc(100vh-2rem)] items-center justify-center rounded-3xl bg-gradient-to-br from-green-700 to-lime-500 p-4"
	>
		<div class="flex w-full max-w-lg flex-col items-center gap-8 rounded-lg bg-white p-8 shadow-lg">
			{#if data.code}
				<h1 class="text-2xl font-bold">Success!</h1>
				<p class="text-sm text-gray-500">
					Your Trade Magnet account has been connected to ServiceM8.
				</p>
				<p class="text-sm text-gray-500">You can now close this page.</p>
			{:else}
				<h1 class="text-2xl font-bold">No authorization code found</h1>
				<p class="text-sm text-gray-500">Please try again by clicking the button below.</p>
				<a href={authURL} target="_blank">
					<button class="rounded-md bg-blue-500 px-4 py-2 text-white">Connect account</button>
				</a>
			{/if}
		</div>
	</main>
</div>
