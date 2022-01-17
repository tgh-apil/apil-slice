<script>
	import Navbar from './components/Navbar.component.svelte';
	import Router from 'svelte-spa-router';
	import {routes} from './routes.js';
</script>

<main>
	<Navbar />
	<Router {routes} />
</main>
