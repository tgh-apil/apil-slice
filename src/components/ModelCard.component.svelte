<script>
import { userData } from '../stores.js';

export let modelTitle;
export let modelPoster;
export let modelDescription;
export let modelThumbnailUrl;
export let buttonFunction;

</script>

<div id='container-main'>
    <div id='card-image-container'>
        <div id='card-image-container-image-box'>
            <img src={ modelThumbnailUrl } alt='model thumbnail'>
        </div>
        <div id='card-image-container-title-box'>
            <div id='card-image-container-title'>
                <h1><b>{ modelTitle }</b></h1>
            </div>
            <div id='card-image-container-poster'>
                <p>Model by: <b>{ modelPoster }</b></p>        
            </div>
        </div>
    </div>
    <div id='card-description-container'>
        <div id='card-description-container-description-box'>
            <p>{ modelDescription }</p>
        </div>
        <div id='card-description-container-button-box'>
            {#if $userData}
                {#if $userData.email == 'apiltgh@gmail.com'}
                    <button id='edit-info-button' on:click={() => console.log('editing') }>Edit Model Info</button>
                {/if}
            {/if}
            <button id='launch-model-button' on:click={ buttonFunction }>View {modelTitle}</button>
        </div>
    </div>
</div>

<style>
/* WOW I HATE CSS */

#container-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 2%;
    width: 98%;
    height: 100%;
}

#card-image-container {
    grid-column: 1;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    min-height: 0;
}

#card-image-container-image-box {
    height: 100%;
    width: 100%;
    grid-row: 1 / 3;
    display:flex;
    justify-content: center;
}

#card-image-container-title-box {
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    row-gap: 2%;
    height: 100%;
    width: 100%;
    grid-row: 3;
    justify-content: center;
    text-align: center;
}

#card-image-container-title {
    height: 100%;
    width: 100%;
    grid-row: 1 / 3;
}

#card-image-container-title h1 {
    color: #fff;
}

#card-image-container-poster {
    height: 100%;
    width: 100%;
    grid-row: 3;

}

#card-image-container-image-box img {
    max-width: 100%;
    max-height: 100%;
    display: block;
}

#card-description-container {
    grid-column: 2;
    row-gap: 2%;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    overflow: hidden;
}

#card-description-container-description-box {
    height: 100%;
    width: 100%;
    overflow: auto;
    grid-row: 1 / 3;
}

#card-description-container-button-box {
    height: 100%;
    width: 100%;
    grid-row: 3;
    display: grid;
    grid-template-rows: 1fr 1fr;
    row-gap: 2%;
}

#edit-info-button {
    grid-row: 1;
    height: 100%;
    width: 100%;
    font-size: 1.5rem;
    border-radius: 5px;
    background-color: #e62e2e;
    transition: background-color .1s ease-in;
}

#edit-info-button:hover {
    background-color: #ff0000;
}

#launch-model-button {
    grid-row: 2;
    height: 100%;
    width: 100%;
    font-size: 1.5rem;
    border-radius: 5px;
}

</style>