<script>
import { userData } from '../stores.js';

export let modelTitle;
export let modelPoster;
export let modelId;
export let modelDescription;
export let modelThumbnailUrl;
export let buttonFunction;

let descriptionHidden = true;

</script>

<div id='container-main' on:click={ buttonFunction } on:mouseenter={() => descriptionHidden = false} on:mouseleave={() => descriptionHidden = true}>
    <div id='padding-div'>
        <img src={ modelThumbnailUrl } alt='model thumbnail'>
        <div id='container-inner'>
            <div id='info-box'>
                <div id='model-title-container'>
                    <h1><b>{ modelTitle }</b></h1>
                </div>
                <div id='model-poster-container'>
                    <p>Poster: <b>{ modelPoster }</b></p>        
                </div>
                <div id='model-id-container'>
                    <p>ID: <b> { modelId } </b></p>
                </div>
                <div id='model-description-container' hidden={descriptionHidden}>
                    <p>{ modelDescription }</p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    
/* WOW I HATE CSS */
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
    transition: border 0.25s ease; }

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
}

#info-box {
    height: 100%;
    width: 100%;
}

#model-title-container {
    width: 95%;;
}

#model-title-container h1 {
    font-size: 3.5em;
    color: white;
}

#model-poster-container {
    font-size: 1.3em;
}

#model-id-container {
    font-size: 1.3em;
}

#model-description-container {
    background: rgba(0, 0, 0, 0.2);
    width: 100%;
    height: 10em;
    overflow: auto;
    font-size: 1.3em;
}
</style>