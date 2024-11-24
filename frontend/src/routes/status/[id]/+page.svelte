<script lang="ts">
	const { data } = $props();
	const authURL = `https://go.servicem8.com/oauth/authorize
		?response_type=code
		&client_id=806357
		&scope=example
		&redirect_uri=${window.location.origin}/status/${data.id}`;
</script>

<div class="min-h-screen p-4">
	<main
		class="flex min-h-[calc(100vh-2rem)] items-center justify-center rounded-3xl bg-gradient-to-br from-green-700 to-lime-500 p-4"
	>
		<div class="flex w-full max-w-lg flex-col gap-8 rounded-lg bg-white p-8 shadow-lg">
			<h1 class="text-center text-2xl font-bold">ServiceM8 Integration</h1>
			<p class="text-center text-sm text-gray-500">
				Integrate your TradeMagnet account with ServiceM8.
			</p>
			<a href="https://go.servicem8.com/oauth/authorize">
				<button class="rounded-md bg-blue-500 px-4 py-2 text-white">Connect {data.id}</button>
			</a>
		</div>
	</main>
</div>
