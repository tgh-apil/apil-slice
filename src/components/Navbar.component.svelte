<script>
    import LoginButton from './LoginButton.component.svelte';
    import { userData, descriptionBoxGroupShow, helpBox, navBarSize, uploadPanelShow } from '../stores.js';


    function goAtlasHome() {
        navBarSize.set('navbar-full');

        // can't call replace and reload the window...have to do it like this
        window.location = '/#';

        // best way to dump the 3js scene when switching away??
        location.reload();
    }

    function goHelp() {
        helpBox.set(true);
        descriptionBoxGroupShow.set(false);
    }

    function uploadModel() {
        uploadPanelShow.set(true);
    }

</script>

<nav id={$navBarSize}>
    <div class="col1">
        <button class="logo" on:click={() => goAtlasHome()}>APIL SLICE</button>
    </div>
    {#if $userData}
        {#if $userData.email == 'apiltgh@gmail.com'}
            <div class="col3">
                <button class="navItem" on:click={() => uploadModel()}>Upload Model</button>
            </div>
        {/if}
    {/if}
    <div class="col4">
        <button class="navItem" on:click={() => goAtlasHome()}>Atlas Home</button>
    </div>
    <div class="col5">
        <button class="navItem" on:click={() => console.log('not implemented')}>About</button>
    </div>
    <div class="col6">
        <button class="navItem" on:click={() => goHelp()}>Help</button>
    </div>
    <div class="col7">
        <LoginButton />
    </div>
</nav>

<style>
    #navbar-full {
        background-color: #4242425d;
        position: absolute;
        z-index: 100;
        top: 0%;
        left: 0%;
        right: 5%;
        width: 100%;
        height: 5%;
        display: grid;
        grid-template: repeat(8, 1fr);
        grid-auto-rows: auto;
        grid-gap: 1%;
        justify-items: center;
        align-items: center;
        text-align: center;
    }

    #navbar-viewer {
        background-color: #4242425d;
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

    #navbar-ultrasound {
        background-color: #4242425d;
        position: absolute;
        z-index: 100;
        top: 0%;
        width: 40%;
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
    
    .col7 {
        grid-column: 8;
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