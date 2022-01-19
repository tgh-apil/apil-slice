    <script>
        import { descriptionBox, viewWidth, titleBoxPosition } from '../stores.js';

        let descriptionBoxMax = false;

        let sizeBtnBoxClass = 'btn-box-min';

        function changeDescriptionBoxSize() {
            descriptionBoxMax = !descriptionBoxMax;
            descriptionBox.set(true);

            // holy shit ew
            if (descriptionBoxMax) {
                sizeBtnBoxClass = 'btn-box-max';

                if ($viewWidth.includes('full')) {
                    viewWidth.set('full-more')
                } else {
                    viewWidth.set('half-more')
                }

                titleBoxPosition.set('titleBox-max-description');
            } else {
                sizeBtnBoxClass = 'btn-box-min';

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
                descriptionBoxMax = false;
                sizeBtnBoxClass = 'btn-box-min'

                if ($viewWidth.includes('full')) {
                    viewWidth.set('full-less')
                } else {
                    viewWidth.set('half-less')
                }

                titleBoxPosition.set('titleBox-min-description');
            } else {
                sizeBtnBoxClass = 'btn-box-hide';
                titleBoxPosition.set('titleBox-hidden-description');
            }
        }
    </script>
    
    <div id={sizeBtnBoxClass}>
        <button class="col1" on:click={() => changeDescriptionBoxSize()}>
            {#if descriptionBoxMax}
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
    <div id={$viewWidth}>
        <div id="descriptionBoxInner" hidden={!$descriptionBox} >
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque interdum congue lorem vel commodo. Curabitur eget lacus sit amet metus bibendum blandit sit amet ut neque. Morbi porttitor tortor nulla, in gravida sem accumsan ac. Proin libero purus, vehicula eget pharetra et, pretium ac nisl. Vivamus eget vehicula turpis. Sed vulputate felis eu mi pharetra, lobortis bibendum enim consequat. Vestibulum suscipit neque non urna mollis fringilla. Sed fringilla risus est. Integer sit amet facilisis erat. Donec dignissim massa ac nulla varius ultrices. Nulla luctus sollicitudin erat, vel consectetur enim sagittis non. Phasellus luctus risus quis nunc eleifend, id cursus nunc auctor.
            </p>
            <p>
                Donec at erat sollicitudin, aliquam nisl ut, aliquet est. In condimentum neque ac lobortis dapibus. Maecenas mi quam, pulvinar id vehicula pharetra, finibus scelerisque neque. Maecenas ac odio nisi. Phasellus tincidunt quis elit in vehicula. Nunc in tristique nibh, eu interdum est. Curabitur eu neque nisi. Aenean sollicitudin ultricies fermentum. Pellentesque in sem est. Nullam tempor dui eu quam auctor tempor nec et neque. Vivamus posuere consequat dolor eget luctus. Nulla velit erat, ultrices at aliquam finibus, gravida ut libero. Nunc sed tellus dictum, fermentum libero sit amet, efficitur risus. Nullam nunc augue, tristique vitae malesuada ut, consectetur quis diam.
            </p>
        </div>
    </div>

    <style>       
        #descriptionBoxInner {
            background-color: #1212125e;
            width: 100%;
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
            bottom: 40%;
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
            bottom: 20%;
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