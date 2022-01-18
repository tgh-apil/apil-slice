<script>
    import LoginButton from './LoginButton.component.svelte';
    import { replace } from 'svelte-spa-router';
    import { titleBox, descriptionBox, helpBox } from '../stores.js';


    function goViewer() {
        replace('/');
    }

    function goAtlasHome() {
        // can't call replace and reload the window...
        // maybe model browser should just be a popup window and the main element is the viewer
        window.location = '/#/atlas';

        // best way to dump the 3js scene when switching away??
        location.reload();
    }

    function goHelp() {
        helpBox.set(true);
        descriptionBox.set(false);
        titleBox.set(false);
    }

</script>

<nav id="navbar">
    <div class="col1">
        <a class="logo" href="https://apil-slice.web.app/">APIL Slice</a>
    </div>
    <div class="col2">
        <!-- call replace to not store on browser history so back button doesnt work -->
        <!-- otherwise the 3js scene does not unload when hitting back -->
        <button class="navItem" on:click={goViewer}>3D View</button>
    </div>
    <div class="col3">
        <button class="navItem" on:click={goAtlasHome}>Atlas Home</button>
    </div>
    <div class="col4">
        <button class="navItem" on:click={goHelp}>Help</button>
    </div>
    <div class="col5">
        <LoginButton />
    </div>
</nav>

<style>
    #navbar {
        background-color: #121212e5;
        position: absolute;
        z-index: 100;
        top: 0%;
        width: 70%;
        height: 5%;
        display: grid;
        grid-template: repeat(6, 1fr);
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
</style>