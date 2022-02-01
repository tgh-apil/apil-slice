<script>
	import Simulator from '../../components/Simulator.svelte';
    import DescriptionBox from '../../components/DescriptionBox.component.svelte';
    import { currentView } from '../../stores.js';

    if ($currentView != 'viewer') {
        // can't call replace and reload the window...have to do it like this
        window.location = '/#';

        // best way to dump the 3js scene when switching away??
        location.reload();
    }
</script>

<div>
    <Simulator />
    <DescriptionBox />
</div>