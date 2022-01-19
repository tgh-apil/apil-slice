<script>
	import Simulator from '../../components/Simulator.svelte';
    import HelpBox from '../../components/HelpBox.component.svelte';
    import DescriptionBox from '../../components/DescriptionBox.component.svelte';
    import TitleBox from '../../components/TitleBox.component.svelte';
    import { helpBox, descriptionBox, titleBox, currentView } from '../../stores.js';

    currentView.set('viewer');
</script>

<div>
    <Simulator />
    <DescriptionBox />
</div>