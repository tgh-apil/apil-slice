<script>
    let sortOptions = ['Newest Model First', 'Oldest Model First', 'Alphabetically', 'Reverse Alphabetically', 'Hearts Only', 'Other Models Only'];
    let limitOptions = [3, 6, 9, 'all'];

    let sortOptionSelected;
    let limitOptionSelected;

    export let queryBuilder;
</script>

<div id='search-bar-container'>
    <div id='search-bar-container-inner'>

        <div id='sort-by-container'>
            <select id='sort-by' bind:value={sortOptionSelected}>
                <option value="" selected disabled hidden>Sorting options</option>
                {#each sortOptions as sort, i}
                    <option value={i}>
                        {sort}
                    </option>
                {/each}
            </select>                
        </div>

        <div id='limit-sort-container'>
            <select id='limit-sort' bind:value={limitOptionSelected}>
                <option value="" selected disabled hidden>Number of models to show</option>
                {#each limitOptions as limit, i}
                    <option value={i}>
                        {limit}
                    </option>
                {/each}
            </select>                
        </div>

        <div id='sort-model-button-container'>
            <button id='sort-model-button' on:click={queryBuilder}>Sort Models</button>
        </div>
    </div>
</div>

<style>
    #search-bar-container {
        position: absolute;
        z-index: 102;
        top: 6%;
        width: 100%;
        height: 5%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    #search-bar-container-inner {
        background: #4242427a;
        backdrop-filter: blur(5px);
        height: 100%;
        width: 65%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: auto;
        column-gap: 3%;
    }

    #sort-by-container {
        grid-column: 1;
        width: 100%;
        height: 100%;
        display: grid;
    }

    #limit-sort-container {
        grid-column: 2;
        width: 100%;
        height: 100%;
        display: grid;
    }

    #sort-model-button-container {
        grid-column: 3;
        width: 100%;
        height: 100%;
    }

    #sort-model-button {
        width: 100%;
        height: 100%;
    }

</style>