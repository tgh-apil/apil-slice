    <script>
        import { descriptionBox, descriptionBoxGroupShow, descriptionBoxMax, descriptionBoxShow,
                viewWidth, titleBoxPosition, btnBoxSize, btnBoxSizeShow, modelDescription } from '../stores.js';
        import TitleBox from './TitleBox.component.svelte';

        // splits the possibly long description text to paragraphs
        let descriptionParagraphs  = $modelDescription.split('\n');

        // FUCKING EW EW EW
        function hideDescriptionBox() {
            descriptionBoxShow.set(!$descriptionBoxShow);
            
            if ($descriptionBoxShow) {
                descriptionBoxMax.set(false);
                btnBoxSize.set('btn-box-show');

                if ($viewWidth.includes('full')) {
                    viewWidth.set('full-more')
                } else {
                    viewWidth.set('full-more')
                }

                titleBoxPosition.set('titleBox-show-description');
            } else {
                btnBoxSize.set('btn-box-hide');
                titleBoxPosition.set('titleBox-hidden-description');
            }


        }
    </script>
    
    <div id=descriptionBoxGroup hidden={!$descriptionBoxGroupShow}>
        <div id="title-container">
            <TitleBox />
        </div>
        <div hidden={!$btnBoxSizeShow}>
            <div id={$btnBoxSize}>
                <button on:click={() => hideDescriptionBox()}>
                    {#if $descriptionBoxShow}
                        Hide Description
                    {:else}
                        Show Description
                    {/if}
                </button>
            </div>
        </div>
        <div id={$viewWidth} hidden={!$descriptionBoxShow}>
            <div id={$descriptionBox} >
                {#each descriptionParagraphs as paragraph}
                    <p>{paragraph}</p>
                {/each}
            </div>
        </div>
    </div>

    <style>
        #descriptionBoxInner {
            background: rgba(0, 0, 0, 0.7);
            width: 100%;
            height: 90%;
            margin: 0 auto;
            overflow: auto;
        }

        /* half width, "more" height */
        #half-more {
            position: absolute;
            bottom: 5%;
            height: 0%;
            text-align: left;
            z-index: -1;
            width: 40%;
            overflow: auto;
        }

        /* full width, "more" height */
        #full-more {
            position: absolute;
            bottom: 5%;
            height: 30%;
            text-align: left;
            width: 75%;
            overflow: auto;
        }

        /* Ewwwwwwwwwwwwwwwwwwwwwwwwwwww */
        #btn-box-show {
            position: absolute;
            z-index: 101;
            bottom: 35%;
            display: grid;
            grid-template: repeat(2, 1fr);
            grid-gap: 1%;
            width: 15%;
            height: 5%;
            grid-auto-rows: auto;
            justify-items: center;
            align-items: center;
            text-align: center;
        }

        #btn-box-hide {
            position: absolute;
            z-index: 101;
            bottom: 5%;
            display: grid;
            grid-template: repeat(3, 1fr);
            grid-gap: 1%;
            width: 15%;
            height: 5%;
            grid-auto-rows: auto;
            justify-items: center;
            align-items: center;
            text-align: center;
        }
        /* end ewwwwwww */

    button {
        background-color: #007070;
        color: #fff;
        border-style: none;
        height: 100%;
        width: 100%;
        transition: background-color .1s ease-in;
        -webkit-transition: background-color .1s ease-in;
        -o-transition: background-color .1s ease-in;
        -moz-transition: background-color .1s ease-in;
    }

    button:hover{
        background-color: #00acac;
    }

    </style>