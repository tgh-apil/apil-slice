    <script>
        import { helpBox, descriptionBox, titleBox } from '../stores.js';

        function closeHelp() {
            helpBox.set(false);
            titleBox.set(true)
            descriptionBox.set(true);
        }
    </script>
    
    <div id="instructionBox" hidden={!$helpBox}>
        <div id="instructionBoxInner">
            <h1>
                INSTRUCTIONS
            </h1>
            <h2>Model Navigation</h2>
            <table>
                <tr>
                    <th>Action</th>
                    <th>Mouse Button</th>
                </tr>
                <tr>
                    <td>Rotate</td>
                    <td>Left Click</td>
                </tr>
                <tr>
                    <td>Pan</td>
                    <td>Right Click</td>
                </tr>
                <tr>
                    <td>Zoom in</td>
                    <td>Mouse wheel up</td>
                </tr>
                <tr>
                    <td>Zoom out</td>
                    <td>Mouse wheel down</td>
                </tr>
                <tr>
                    <td>Quick zoom in</td>
                    <td>Middle mouse button & push mouse forward</td>
                </tr>
                <tr>
                    <td>Quick zoom out</td>
                    <td>Middle mouse button & pull mouse backward</td>
                </tr>
            </table>
            <h2>TEE Controls</h2>
            <table>
                <tr>
                    <th>Action</th>
                    <th>Keyboard</th>
                    <th>Mouse Box</th>
                    <th>High-fidelity</th>
                </tr>

                <tr>
                    <td>Advance</td>
                    <td>W</td>
                    <td>Push forward</td>
                    <td>Push forward</td>
                </tr>
                <tr>
                    <td>Retract</td>
                    <td>S</td>
                    <td>Pull backward</td>
                    <td>Pull backward</td>
                </tr>
                <tr>
                    <td>Twist Left</td>
                    <td>A</td>
                    <td>Turn handle left</td>
                    <td>Turn handle left</td>
                </tr>
                <tr>
                    <td>Twist Right</td>
                    <td>D</td>
                    <td>Turn handle right</td>
                    <td>Turn handle right</td>
                </tr>
                <tr>
                    <td>Omniplane Counter-clockwise</td>
                    <td>Q</td>
                    <td>Left mouse button</td>
                    <td>Button 1</td>
                </tr>
                <tr>
                    <td>Omniplane Clockwise</td>
                    <td>E</td>
                    <td>Right mouse button</td>
                    <td>Button 2</td>
                </tr>
                <tr>
                    <td>Anteflex</td>
                    <td>Arrow up</td>
                    <td>Mousewheel forward</td>
                    <td>Wheel up</td>
                </tr>
                <tr>
                    <td>Probe Head Left</td>
                    <td>Arrow left</td>
                    <td>Unbound</td>
                    <td>Unbound</td>
                </tr>
                <tr>
                    <td>Probe Head Right</td>
                    <td>Arrow right</td>
                    <td>Unbound</td>
                    <td>Unbound</td>
                </tr>
            </table>
            <br>
            <button id="instructionsCloseBtn" on:click={() => closeHelp()}>
                Close
            </button>
        </div>
    </div>

<style>
    th, td {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        padding-right: 1rem;
    }
    
    #instructionBox {
        background-color: rgba(0, 0, 0, 0.8);
        position: absolute;
        top: 0%;
        width: 100%;
        height: 100%;
        text-align: left;
        z-index: 100;
    }

    #instructionBoxInner {
        height: auto;
        width: 70%;
        height: 100%;
        margin: 0 auto;
    }

    #instructionsCloseBtn {
        background-color: #007070;
        color: #fff;
        width: 12%;
        height: 3%;
        border-style: none;
        transition: background-color .1s ease-in;
        -webkit-transition: background-color .1s ease-in;
        -o-transition: background-color .1s ease-in;
        -moz-transition: background-color .1s ease-in;
    }

    #instructionsCloseBtn:hover{
        background-color: #00acac;
    }
</style>