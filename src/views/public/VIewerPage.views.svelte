<script>
	import Simulator from '../../components/Simulator.svelte';
    import HelpBox from '../../components/HelpBox.component.svelte';
    import DescriptionBox from '../../components/DescriptionBox.component.svelte';
    import { currentView } from '../../stores.js';

    currentView.set('viewer');
</script>

<div>
    <HelpBox />
    <Simulator />
    <DescriptionBox />
</div>