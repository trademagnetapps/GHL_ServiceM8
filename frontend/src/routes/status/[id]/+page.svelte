<script lang="ts">
	const { data } = $props();
</script>

<main
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 to-lime-500 p-4"
>
	<div class="flex w-full max-w-lg flex-col gap-8 rounded-lg bg-white p-8 shadow-lg">
		<h1 class="text-center text-2xl font-bold">ServiceM8 Integration</h1>

		<p class="text-center text-sm text-gray-500">
			<button class="rounded-md bg-blue-500 px-4 py-2 text-white">Connect {data.id}</button>
		</p>
	</div>
</main>
