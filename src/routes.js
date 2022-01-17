import ViewerPage from './views/public/ViewerPage.views.svelte';
import NotFound from './views/public/NotFound.views.svelte';

export let routes = {
    '/': ViewerPage,
    '/viewer': ViewerPage,
    "*": NotFound,
}
