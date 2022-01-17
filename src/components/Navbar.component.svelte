<script>
    import LoginButton from './LoginButton.component.svelte';

    function goAtlasHome() {
        window.location = '/'
    }

    function goViewer() {
        window.location = '/viewer'
    }

</script>

<nav id="navbar">
    <div class="col1">
        <a class="logo" href="https://apil-slice.web.app/">APIL Slice</a>
    </div>
    <div class="col2">
        <button class="navItem" on:click|preventDefault={goViewer}>3D View</button>
    </div>
    <div class="col3">
        <button class="navItem">U/S View</button>
    </div>
    <div class="col4">
        <button class="navItem" on:click|preventDefault={goAtlasHome}>Atlas Home</button>
    </div>
    <div class="col5">
        <button class="navItem">Help</button>
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
        width: 70%;
        height: 3%;
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
</style>