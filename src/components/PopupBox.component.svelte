<script>
    export let popupInputUiHidden;
    export let popupLabel;
    export let popupType;
    export let popupConfirmText;
    export let popupConfrimFunction;
    export let popupCancelFunction;
</script>

<div hidden={popupInputUiHidden}>
    <div id="popup-input-ui-outer">
        <div id="popup-input-ui-inner">
            <h2 for='input-ui-input-field' id=input-ui-1><b>{popupLabel}</b></h2>
            {#if popupType == 'input'}
                <input type='text' id=input-ui-2 />
            {:else}
                <br id=input-ui-2 />
            {/if}
            <button id='input-ui-3' on:click={popupConfrimFunction}>{popupConfirmText}</button>
            <button id='input-ui-4'on:click={popupCancelFunction}>Cancel</button>
        </div>
    </div>
</div>

<style>
    #popup-input-ui-outer {
        position: absolute;
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    #popup-input-ui-inner {
        position: absolute;
        border: solid 1px #424242;
        z-index: 100;
        background: #121212e5;
        width: 30%;
        height: 15%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 1%;
        row-gap: 1%;
    }
    
    #input-ui-1 {
        grid-column: 1 / 3;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        grid-row: 1;
    }

    #input-ui-2 {
        grid-column: 1 / 3;
        grid-row: 2;
    }

    #input-ui-3 {
        grid-column: 1;
        grid-row: 3;
    }

    #input-ui-4 {
        grid-column: 2;
        grid-row: 3;
    }
</style>