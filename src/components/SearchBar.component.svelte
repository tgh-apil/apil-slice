<script>
    let dateSort = ['Newest first', 'Oldest first'];
    let titleSort = ['A -> Z', 'Z -> A'];
    let modelTypeSort = ['All', 'Heart', 'Other'];

    // not yet implemented
    let collectionSort = ['All', 'Normal Hearts', 'ACHD'];

    let selectedDate;
    let selectedTitle;
    let selectedModelType;

    // not yet implemented
    let selectedCollection;

    export let queryBuilder;
</script>

<div id='search-bar-container'>
    <div id='search-bar-container-inner'>

        <div id='date-sort-container'>
            <label id='date-sort-label' for='date-sort'><b>Date:</b></label>
            <select id='date-sort' bind:value={selectedDate}>
                {#each dateSort as date, i}
                    <option value={i}>
                        {date}
                    </option>
                {/each}
            </select>                
        </div>

        <div id='title-sort-container'>
            <label id='title-sort-label' for='title-sort'><b>Title:</b></label>
            <select id='title-sort' bind:value={selectedTitle}>
                {#each titleSort as title, i}
                    <option value={i}>
                        {title}
                    </option>
                {/each}
            </select>                
        </div>

        <div id='model-type-sort-container'>
            <label id='model-type-sort-label' for='model-type-sort'><b>Model Type:</b></label>
            <select id='model-type-sort' bind:value={selectedModelType}>
                {#each modelTypeSort as modelType}
                    <option value={modelType.toLowerCase()}>
                        {modelType}
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
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: auto;
        column-gap: 1%;
    }

    #date-sort-container {
        grid-column: 1;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #date-sort-label {
        grid-row: 1;
    }

    #date-sort {
        grid-row: 2;
    }

    #title-sort-container {
        grid-column: 2;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #title-sort-label {
        grid-row: 1;
    }

    #title-sort {
        grid-row: 2;
    }

    #model-type-sort-container {
        grid-column: 3;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #model-type-sort-label {
        grid-row: 1;
    }

    #model-type-sort {
        grid-row: 2;
    }

    #sort-model-button-container {
        grid-column: 4;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: right;
        align-items: right;
    }

    #sort-model-button {
        width: 90%;
        height: 100%;
    }

</style>