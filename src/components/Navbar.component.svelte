<script>
    import LoginButton from './LoginButton.component.svelte';
    import { currentView, descriptionBoxGroupShow, helpBox } from '../stores.js';


    function goViewer() {
        console.log('not set')
    }

    function goAtlasHome() {
        // can't call replace and reload the window...have to do it like this
        window.location = '/#';

        // best way to dump the 3js scene when switching away??
        location.reload();
    }

    function goHelp() {
        helpBox.set(true);
        descriptionBoxGroupShow.set(false);
    }

</script>

<nav id="navbar">
    <div class="col1">
        <button class="logo" on:click={goAtlasHome}>APIL SLICE</button>
    </div>

    <!-- {#if $currentView == 'viewer'}
        <div class="col2">
            <button class="navItem" on:click={goViewer}>3D View</button>
        </div>
        <div class="col3">
            <button class="navItem" on:click={goViewer}>U/S View</button>
        </div>
    {/if} -->

    <div class="col4">
        <button class="navItem" on:click={goAtlasHome}>Atlas Home</button>
    </div>
    <div class="col5">
        <button class="navItem" on:click={goHelp}>Help</button>
    </div>
    <div class="col6">
        <LoginButton />
    </div>
</nav>

<style>
    #navbar {
        background-color: #121212e5;
        position: absolute;
        z-index: 100;
        top: 0%;
        width: 80%;
        height: 5%;
        display: grid;
        grid-template: repeat(7, 1fr);
        grid-auto-rows: auto;
        grid-gap: 1%;
        justify-items: center;
        align-items: center;
        text-align: center;
    }

    .logo {
        color: #00acac;
        text-decoration: none;
        font-weight: bold;
        transition: color 0.1s ease-in;
    }

    .logo:hover {
        color: #fff;
    }

    .navItem {
        text-decoration: none;
        font-weight: lighter;
        transition: color 0.1s ease-in;
    }

    .navItem:hover {
        color: #00acac;
    }

    .col1 {
        grid-column: 1 / 2;
    }

    .col2 {
        grid-column: 3;
    }

    .col3 {
        grid-column: 4;
    }

    .col4 {
        grid-column: 5;
    }

    .col5 {
        grid-column: 6;
    }

    .col6 {
        grid-column: 7;
    }

    button {
        background: none;
        color: #fff;
        border-style: none;
        z-index: 100%;
        width: 100%;
        height: 100%;
        text-decoration: none;
        font-weight: lighter;
        transition: color 0.05s ease-in;
    }

    button:hover {
        color: #00acac;
    }
</style>