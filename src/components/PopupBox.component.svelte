<script>
    export let popupInputUiHidden;
    export let popupLabel;
    export let popupType;
    export let popupConfirmOptions;
    export let popupCancelFunction;

</script>

<div hidden={popupInputUiHidden}>
    <div id="popup-input-ui-outer">
        <div id="popup-input-ui-inner">
            <div id=popup-input-ui-label-box>
                <div id='popup-input-label-box'>
                    <h2 for='input-ui-input-field' ><b>{popupLabel}</b></h2>
                </div>
                <div id='popup-input-box'>
                    {#if popupType == 'input'}
                        <input id='input-field' type='text' />
                    {:else}
                        <br />
                    {/if}
                </div>
            </div>
            <div id='popup-input-button-box'>
                {#each popupConfirmOptions as option}
                    <button id='confirm-button' on:click={option.fn}>{option.text}</button>
                {/each}
                <button on:click={popupCancelFunction}>Cancel</button>
            </div>
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
        z-index: 103;
        background: #121212e5;
        backdrop-filter: blur(5px);
        width: 30%;
        height: auto;
        display: grid;
        grid-template-rows: 4fr 1fr;
        row-gap: 2%;
    }
    
    #popup-input-ui-label-box {
        grid-row: 1;
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #popup-input-label-box {
        grid-row: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    #popup-input-box {
        grid-row: 2;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    #popup-input-box input {
        width: 90%;
        height: 50%;
    }

    #popup-input-button-box {
        grid-row: 2;
        display: grid;
        grid-auto-flow: column;
        column-gap: 1%;
        row-gap: 2%;
    }

    #popup-input-button-box button {
        height: 100%;
        width: 100%;
    }
</style>