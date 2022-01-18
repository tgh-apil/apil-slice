import ViewerPage from './views/public/ViewerPage.views.svelte';
import ModelSelect from './views/public/ModelSelect.views.svelte';
import NotFound from './views/public/NotFound.views.svelte';

export let routes = {
    '/': ViewerPage,
    '/atlas': ModelSelect,
    '/viewer': ViewerPage,
    "*": NotFound,
}
