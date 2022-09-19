<script>
    import LoginButton from './LoginButton.component.svelte';
    import { currentView, userData, helpBox, descriptionBoxShow, decsriptionBoxHeight, navBarSize, uploadPanelShow, editModelDataOn, userIsAdmin } from '../stores.js';

    function goAtlasHome() {
        navBarSize.set('navbar-full');

        // can't call replace and reload the window...have to do it like this
        window.location = '/#';

        // best way to dump the 3js scene when switching away??
        location.reload();
    }

    function goHelp() {
        if (!$helpBox) {
            helpBox.set(true);
            descriptionBoxShow.set(false);
            decsriptionBoxHeight.set('15%');
        } else {
            helpBox.set(false);
        }
    }

    function uploadModel() {
        uploadPanelShow.set(true);
    }

    function editModelData() {
        editModelDataOn.set(!$editModelDataOn);
    }

</script>

<nav id={$navBarSize}>
    <div class="col1">
        <button class="logo" on:click={() => goAtlasHome()}>APIL SLICE</button>
    </div>
    <!-- refactor me -->
    {#if $userData}
        {#if $userIsAdmin}
            {#if $currentView == 'home'}
                {#if !$uploadPanelShow}
                    {#if !$editModelDataOn}
                        <div class="col3">
                            <button class="navItem" on:click={() => uploadModel()}>Upload Model</button>
                        </div>
                    {/if}
                    <div class="col4">
                        {#if $editModelDataOn}
                            <button class="navItem" on:click={() => editModelData()}>Stop Editing Model Data</button>
                        {:else}
                            <button class="navItem" on:click={() => editModelData()}>Edit Model Data</button>
                        {/if}
                    </div>
                {/if}
            {/if}
        {/if}
    {/if}
    <div class="col5">
        <button class="navItem" on:click={() => goAtlasHome()}>Atlas Home</button>
    </div>
    <div class="col6">
        <button class="navItem" on:click={() => console.log('not implemented')}>About</button>
    </div>
    <div class="col7">
        <button class="navItem" on:click={() => goHelp()}>Help</button>
    </div>
    <div class="col8">
        <LoginButton />
    </div>
</nav>

<style>
    #navbar-full {
        background: #4242427a;
        backdrop-filter: blur(5px);
        position: absolute;
        z-index: 105;
        top: 0%;
        left: 0%;
        right: 5%;
        width: 100%;
        height: 3rem;
        display: grid;
        grid-template: repeat(8, 1fr);
        grid-auto-rows: auto;
        grid-gap: 1%;
        justify-items: center;
        align-items: center;
        text-align: center;
    }

    #navbar-viewer {
        background: #4242427a;
        backdrop-filter: blur(5px);
        position: absolute;
        z-index: 100;
        top: 0%;
        width: 80%;
        height: 2.5rem;
        display: grid;
        grid-template: repeat(7, 1fr);
        grid-auto-rows: auto;
        grid-gap: 1%;
        justify-items: center;
        align-items: center;
        text-align: center;
    }

    #navbar-ultrasound {
        background: #4242427a;
        backdrop-filter: blur(5px);
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
        grid-column: 3;
    }

    .col4 {
        grid-column: 4;
    }

    .col5 {
        grid-column: 5;
    }

    .col6 {
        grid-column: 6;
    }
    
    .col7 {
        grid-column: 7;
    }

    .col8 {
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