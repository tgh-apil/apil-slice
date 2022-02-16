<script>
export let modelTitle;
export let modelPoster;
export let modelId;
export let modelDescription;
export let modelThumbnailUrl;
export let buttonFunction;

let descriptionHidden = true;

</script>

<div id='container-main' on:click={ buttonFunction } on:mouseenter={() => descriptionHidden = false} on:mouseleave={() => descriptionHidden = true}>
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
                    <h1><b>{ modelTitle }</b></h1>
                </div>
                <div>
                    <div id='model-poster-id-container' >
                        <div id='model-poster-container'>
                            <p>Poster: <b>{ modelPoster }</b></p>        
                        </div>
                        <div id='model-id-container'>
                            <p>ID: <b> { modelId } </b></p>
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
    display: grid;
    width: 98%;
    height: 100%;
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
    border: 1em solid #00acac;
}

#container-main img {
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
}

#info-box {
    position: absolute;
    top: 50%;
    height: 50%;
    width: 100%;
    display: grid;
    grid-template-rows: 2fr 1fr;
}

#model-title-container {
    width: 95%;
    bottom: 2%;
    grid-row: 1;
}

#model-title-container h1 {
    font-size: 2em;
    color: white;
}

#model-poster-id-container {
    grid-row: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
}

#model-poster-container {
    font-size: 1.1em;
    grid-column: 1;
}

#model-id-container {
    font-size: 1.1em;
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