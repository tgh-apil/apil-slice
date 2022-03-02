<script>
    import { editModelDataOn } from '../stores.js'

    export let modelTitle;
    export let modelPoster;
    export let modelId;
    export let modelDescription;
    export let modelThumbnailUrl;
    export let buttonFunction;

    let descriptionHidden = true;

    let cardContainerStyle;
    
    if ($editModelDataOn) {
        cardContainerStyle = 'container-main-editing';
    } else {
        cardContainerStyle = 'container-main';
    }

</script>

<div id={cardContainerStyle} on:click={ buttonFunction } on:mouseenter={() => descriptionHidden = false} on:mouseleave={() => descriptionHidden = true}>
    <img id='thumbnail-img' src={ modelThumbnailUrl } alt='model thumbnail'>
    <div id='container-inner'>
        <div id='model-description-container-background' hidden={descriptionHidden}>
            <div id='model-description-container'>
                <p id='model-description'>{ modelDescription }</p>
            </div>
        </div>
        <div hidden={!descriptionHidden}>
            <div id='info-box'>
                <div id='model-title-container'>
                    <h1><b id='model-title'>{ modelTitle }</b></h1>
                </div>
                <div>
                    <div id='model-poster-id-container' >
                        <div id='model-poster-container'>
                            <p>Poster: <b id='model-poster'>{ modelPoster }</b></p>        
                        </div>
                        <div id='model-id-container'>
                            <p>ID: <b id='model-id'>{ modelId }</b></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>    
    </div>
</div>

<style>
    #container-main {
        position: relative;
        cursor: pointer;
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        border: 1em solid rgba(0, 0, 0, 0);
        -webkit-transition:  border 0.25s ease;
        -moz-transition:  border 0.25s ease;
        -o-transition:  border 0.25s ease;
        -ms-transition: border 0.25s ease;
        transition: border 0.25s ease;
    }

    #container-main-editing {
        position: relative;
        cursor: pointer;
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        border: 1em solid rgba(0, 0, 0, 0);
        -webkit-transition:  border 0.25s ease;
        -moz-transition:  border 0.25s ease;
        -o-transition:  border 0.25s ease;
        -ms-transition: border 0.25s ease;
        transition: border 0.25s ease;
    }

    #container-main:hover {
        border: 1em solid var(--border-color, #00acac);
    }

    #container-main-editing:hover {
        border: 1em solid var(--border-color, #ff0000);
    }

    #container-main img {
        width: 100%;
        height: 100%;
        display: block;
    }

    #container-main-editing img {
        width: 100%;
        height: 100%;
        display: block;
    }

    #container-inner {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    #info-box {
        position: absolute;
        height: 100%;
        width: 100%;
        display: grid;
        grid-template-rows: 2fr 1fr;
    }

    #model-title-container {
        width: 95%;
        grid-row: 1;
    }

    #model-title-container h1 {
        font-size: 1.3em;
        color: white;
    }

    #model-poster-id-container {
        grid-row: 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    #model-poster-container {
        font-size: 1.2em;
        grid-column: 1;
    }

    #model-id-container {
        font-size: 1.2em;
        grid-column: 2;
    }

    #model-description-container-background {
        background: #0000007a;
        backdrop-filter: blur(5px);
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #model-description-container {
        top: 0;
        width: 95%;
        height: 95%;
        overflow: auto;
        font-size: 1.1em;
    }

    [hidden] {
        display: none !important;
    }

</style>