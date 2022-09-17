<script>
    export let sortOptions;
    export let limitOptions;
    export let queryBuilder;
</script>

<!-- todo: make this more generic -->
<div id='search-bar-container'>
    <div id='search-bar-container-inner'>
        <div id='sort-by-container'>
            <label id='sort-by-label' for='sort-by'>Sort by:</label>
            <select id='sort-by'>
                {#each sortOptions as sort, i}
                    <option value={i}>
                        {sort.label}
                    </option>
                {/each}
            </select>                
        </div>

        <div id='limit-sort-container'>
            <label id='limit-sort-label' for='limit-sort'>Number of models to show:</label>
            <select id='limit-sort'>
                <option value={limitOptions[3]} selected disabled hidden>{limitOptions[3]}</option>
                {#each limitOptions as limit}
                    <option value={limit}>
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
        top: 8vh;
        width: 100%;
        height: 3rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    #search-bar-container-inner {
        background: #4242427a;
        backdrop-filter: blur(5px);
        height: 100%;
        width: 50%;
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
        grid-template-rows: 1fr 1fr;
    }

    #limit-sort-container {
        grid-column: 2;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr;
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

    label {
        font-size: 1.05em;
    }

    select {
        font-size: 1.1em;
    }

</style>