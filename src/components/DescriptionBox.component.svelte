    <script>
        import { descriptionBox, descriptionBoxGroupShow, descriptionBoxMax, viewWidth, titleBoxPosition, btnBoxSize, btnBoxSizeShow, modelDescription } from '../stores.js';
        import TitleBox from './TitleBox.component.svelte';

        // splits the possibly long description text to paragraphs
        let descriptionParagraphs  = $modelDescription.split('\n');

        // todo: re-write this shit        
        function changeDescriptionBoxSize() {
            descriptionBoxMax.set(!$descriptionBoxMax);
            descriptionBox.set(true);

            // holy shit ew
            if ($descriptionBoxMax) {
                btnBoxSize.set('btn-box-max');

                if ($viewWidth.includes('full')) {
                    viewWidth.set('full-more')
                } else {
                    viewWidth.set('half-more')
                }

                titleBoxPosition.set('titleBox-max-description');
            } else {
                btnBoxSize.set('btn-box-min');

                if ($viewWidth.includes('full')) {
                    viewWidth.set('full-less')
                } else {
                    viewWidth.set('half-less')
                }

                titleBoxPosition.set('titleBox-min-description');
            }
        }

        // EW EW EW
        function hideDescriptionBox() {
            descriptionBox.set(!$descriptionBox);

            if ($descriptionBox) {
                descriptionBoxMax.set(false);
                btnBoxSize.set('btn-box-min');

                if ($viewWidth.includes('full')) {
                    viewWidth.set('full-less')
                } else {
                    viewWidth.set('half-less')
                }

                titleBoxPosition.set('titleBox-min-description');
            } else {
                btnBoxSize.set('btn-box-hide');
                titleBoxPosition.set('titleBox-hidden-description');
            }
        }
    </script>
    <div id=descriptionBoxGroup hidden={!$descriptionBoxGroupShow}>
        <TitleBox />

        <div hidden={!$btnBoxSizeShow}>
            <div id={$btnBoxSize}>
                <button class="col1" on:click={() => changeDescriptionBoxSize()}>
                    {#if $descriptionBoxMax}
                        Show Less
                    {:else}
                        Show More
                    {/if}
                </button>
                <button class="col2" on:click={() => hideDescriptionBox()}>
                    {#if $descriptionBox}
                        Hide Description
                    {:else}
                        Show Description
                    {/if}
                </button>
            </div>
        </div>
        <div id={$viewWidth}>
            <div id="descriptionBoxInner" hidden={!$descriptionBox}>
                {#each descriptionParagraphs as paragraph}
                    <p>{paragraph}</p>
                {/each}
            </div>
        </div>
    </div>

    <style>       
        #descriptionBoxInner {
            background: rgba(0, 0, 0, 0.80);
            width: 100%;
            height: 90%;
            margin: 0 auto;
        }

        /* half width, "less" height */
        #half-less {
            position: absolute;
            bottom: 5%;
            height: 15%;
            text-align: left;
            z-index: 100;
            width: 50%;
            overflow: auto;
        }

        /* half width, "more" height */
        #half-more {
            position: absolute;
            bottom: 5%;
            height: 35%;
            text-align: left;
            z-index: 100;
            width: 50%;
            overflow: auto;
        }

        /* full width, "less" height */
        #full-less {
            position: absolute;
            bottom: 5%;
            height: 15%;
            text-align: left;
            z-index: 100;
            width: 100%;
            overflow: auto;
        }

        /* full width, "more" height */
        #full-more {
            position: absolute;
            bottom: 5%;
            height: 35%;
            text-align: left;
            z-index: 100;
            width: 100%;
            overflow: auto;
        }

        /* Ewwwwwwwwwwwwwwwwwwwwwwwwwwww */
        #btn-box-max {
            position: absolute;
            z-index: 101;
            bottom: 42%;
            display: grid;
            grid-template: repeat(2, 1fr);
            grid-gap: 1%;
            width: 35%;
            height: 3%;
            grid-auto-rows: auto;
            justify-items: center;
            align-items: center;
            text-align: center;
        }

        #btn-box-min {
            position: absolute;
            z-index: 101;
            bottom: 22%;
            display: grid;
            grid-template: repeat(3, 1fr);
            grid-gap: 1%;
            width: 35%;
            height: 3%;
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
            width: 35%;
            height: 3%;
            grid-auto-rows: auto;
            justify-items: center;
            align-items: center;
            text-align: center;
        }
        /* end ewwwwwww */

        .col1 {
            grid-column: 1;
        }

        .col2 {
            grid-column: 2;
        }

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