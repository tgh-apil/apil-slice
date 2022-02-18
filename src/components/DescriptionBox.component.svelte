<script>
    import { descriptionBoxShow, viewWidth, decsriptionBoxHeight, modelDescription, modelDownloadUrl, storeUrlList } from '../stores.js';
    import TitleBox from './TitleBox.component.svelte';

    // splits the possibly long description text to paragraphs -- not working from firebase
    let descriptionParagraphs  = $modelDescription.split('\n');

    function hideDescriptionBox() {
        descriptionBoxShow.set(!$descriptionBoxShow);

        if ($descriptionBoxShow) {
            decsriptionBoxHeight.set('30%');
        } else {
            decsriptionBoxHeight.set('15%');
        }
    }

</script>

<div id={$viewWidth} style='--view-height: {$decsriptionBoxHeight}'>
    <div id='title-button-box-container'>
        <div id='description-title-box'>
            <TitleBox />
        </div>
        <div id='description-button-box'>
            <div id='description-button-1'>
                <button on:click={() => hideDescriptionBox()}>
                    {#if $descriptionBoxShow}
                        Hide Description
                    {:else}
                        Show Description
                    {/if}
                </button>
            </div>
            <div id='description-button-2'>
                <a href={$modelDownloadUrl}>
                    <button>Download 3D Model (.glb)</button>
                </a>
            </div>
            {#if $storeUrlList}
                {#each $storeUrlList as storeListing}
                    <div>
                        <a href={storeListing.url}>
                            <button>Purchase {storeListing.name}</button>
                        </a>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
    <div id='description-box' hidden={!$descriptionBoxShow}>
        {#each descriptionParagraphs as paragraph}
            <p>{paragraph}</p>
        {/each}          
    </div>
</div>

<style>
    #description-box {
        background: #0000007a;
        backdrop-filter: blur(5px);
        height: 100%;
        width: 100%;
        overflow: auto;
    }

    #description-button-box {
        display: grid;
        grid-auto-flow: column;
        column-gap: 1%;
        width: 100%;
        height: 3rem;
    }

    #half {
        position: absolute;
        z-index: 102;
        display: grid;
        grid-template-rows: 1fr 2fr;
        row-gap: 2%;
        height: var(--view-height);
        width: 40%;
        bottom: 3.5%;
    }

    #full {
        position: absolute;
        z-index: 102;
        display: grid;
        grid-template-rows: 1fr 2fr;
        row-gap: 2%;
        height: var(--view-height);
        width: 80%;
        bottom: 3.5%;
    }

    button {
        height: 100%;
        width: 100%;
    }

</style>