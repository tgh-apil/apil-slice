<script>
	import Navbar from './components/Navbar.component.svelte';
	import Router from 'svelte-spa-router';
	import HelpBox from './components/HelpBox.component.svelte';
	import { routes } from './routes.js';
	import { helpBox } from './stores';
</script>

<main>
	<Navbar />
	
	<Router {routes} />

    {#if $helpBox}
        <HelpBox />
    {/if}
</main>
