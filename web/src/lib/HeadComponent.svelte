<script>
	export let data;
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={data.description} />
	<link rel="manifest" href="/assets/manifest.json" />
</svelte:head>
