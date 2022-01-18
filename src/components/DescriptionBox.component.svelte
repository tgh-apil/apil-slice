    <script>
        import { descriptionBox } from '../stores.js';
    </script>
    
    <div id="descriptionBox">
        <div id="descriptionBoxInner" hidden={!$descriptionBox}>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque interdum congue lorem vel commodo. Curabitur eget lacus sit amet metus bibendum blandit sit amet ut neque. Morbi porttitor tortor nulla, in gravida sem accumsan ac. Proin libero purus, vehicula eget pharetra et, pretium ac nisl. Vivamus eget vehicula turpis. Sed vulputate felis eu mi pharetra, lobortis bibendum enim consequat. Vestibulum suscipit neque non urna mollis fringilla. Sed fringilla risus est. Integer sit amet facilisis erat. Donec dignissim massa ac nulla varius ultrices. Nulla luctus sollicitudin erat, vel consectetur enim sagittis non. Phasellus luctus risus quis nunc eleifend, id cursus nunc auctor.
            </p>
            <p>
                Donec at erat sollicitudin, aliquam nisl ut, aliquet est. In condimentum neque ac lobortis dapibus. Maecenas mi quam, pulvinar id vehicula pharetra, finibus scelerisque neque. Maecenas ac odio nisi. Phasellus tincidunt quis elit in vehicula. Nunc in tristique nibh, eu interdum est. Curabitur eu neque nisi. Aenean sollicitudin ultricies fermentum. Pellentesque in sem est. Nullam tempor dui eu quam auctor tempor nec et neque. Vivamus posuere consequat dolor eget luctus. Nulla velit erat, ultrices at aliquam finibus, gravida ut libero. Nunc sed tellus dictum, fermentum libero sit amet, efficitur risus. Nullam nunc augue, tristique vitae malesuada ut, consectetur quis diam.
            </p>
        </div>
    </div>

    <style>
        #descriptionBox {
            position: absolute;
            bottom: 5%;
            height: 15%;
            text-align: left;
            z-index: 100;
            width: 100%;
            overflow: auto;
        }
        
        #descriptionBoxInner {
            width: 100%;
            margin: 0 auto;
        }
    </style>