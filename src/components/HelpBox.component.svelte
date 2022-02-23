    <script>
        import { helpBox } from '../stores.js';

        function closeHelp() {
            helpBox.set(false);
        }
    </script>
    
    <div id="instruction-box" hidden={!$helpBox}>
        <div id="instruction-box-inner">
            <div id='instruction-box-table'>
                <h1>
                    INSTRUCTIONS
                </h1>
                <h2>
                    Model Navigation
                </h2>
                <table>
                    <tr>
                        <th><b>Action</b></th>
                        <th><b>Mouse Button</b></th>
                        <th><b>Keyboard</b></th>
                        <th><b>Additional Notes</b></th>
                    </tr>
                    <tr>
                        <td>Rotate</td>
                        <td>Left Click</td>
                        <td class='td-unbound'>Unbound</td>
                    </tr>
                    <tr>
                        <td>Pan</td>
                        <td>Right Click</td>
                        <td class='td-unbound'>Unbound</td>
                    </tr>
                    <tr>
                        <td>Zoom in</td>
                        <td>Mouse wheel up</td>
                        <td class='td-unbound'>Unbound</td>
                    </tr>
                    <tr>
                        <td>Zoom out</td>
                        <td>Mouse wheel down</td>
                        <td class='td-unbound'>Unbound</td>
                    </tr>
                    <tr>
                        <td>Add new annotation</td>
                        <td>Double left click anywhere on the model</td>
                        <td class='td-unbound'>Unbound</td>
                        <td><i>Only available when in 3D viewer mode</i></td>
                    </tr>
                </table>
                <h2>
                    Ultrasound Controls
                </h2>
                <table>
                    <tr>
                        <th><b>Action</b></th>
                        <th><b>Keyboard</b></th>
                        <th><b>Mouse</b></th>
                        <th><b>Rod</b></th>
                        <th><b>TEE Probe</b></th>
                    </tr>
                    <tr>
                        <td>Advance</td>
                        <td>Arrow Up</td>
                        <td>Push forward</td>
                        <td>Push forward</td>
                        <td>Push forward</td>
                    </tr>
                    <tr>
                        <td>Retract</td>
                        <td>Arrow Down</td>
                        <td>Pull backward</td>
                        <td>Pull backward</td>
                        <td>Pull backward</td>
                    </tr>
                    <tr>
                        <td>Rotate Left</td>
                        <td>Arrow Left</td>
                        <td>Move mouse left</td>
                        <td>Turn handle left</td>
                        <td>Turn handle left</td>
                    </tr>
                    <tr>
                        <td>Rotate Right</td>
                        <td>Arrow Right</td>
                        <td>Move mouse right</td>
                        <td>Turn handle right</td>
                        <td>Turn handle right</td>
                    </tr>
                    <tr>
                        <td>Omniplane Counter-clockwise</td>
                        <td>Q</td>
                        <td>Left mouse button</td>
                        <td>Left mouse button</td>
                        <td>Button 1</td>
                    </tr>
                    <tr>
                        <td>Omniplane Clockwise</td>
                        <td>E</td>
                        <td>Right mouse button</td>
                        <td>Right mouse button</td>
                        <td>Button 2</td>
                    </tr>
                    <tr>
                        <td>Anteflex</td>
                        <td>W</td>
                        <td>Mousewheel forward</td>
                        <td>Mousewheel forward</td>
                        <td>Wheel up</td>
                    </tr>
                    <tr>
                        <td>Retroflex</td>
                        <td>S</td>
                        <td>Mousewheel backward</td>
                        <td>Mousewheel backward</td>
                        <td>Wheel down</td>
                    </tr>
                    <tr>
                        <td>Probe Head Left</td>
                        <td>A</td>
                        <td class='td-unbound'>Unbound</td>
                        <td class='td-unbound'>Unbound</td>
                        <td class='td-unbound'>Unbound</td>
                    </tr>
                    <tr>
                        <td>Probe Head Right</td>
                        <td>D</td>
                        <td class='td-unbound'>Unbound</td>
                        <td class='td-unbound'>Unbound</td>
                        <td class='td-unbound'>Unbound</td>
                    </tr>
                </table>
                <h2>
                    Additional Options
                </h2>
                <table>
                    <tr>
                        <th><b>Action</b></th>
                        <th><b>Keyboard</b></th>
                        <th><b>Mouse</b></th>
                        <th><b>Notes</b></th>
                    </tr>
                    <tr>
                        <td>Activate & deactivate ultrasound controller</td>
                        <td>T</td>
                        <td class='td-unbound'>Unbound</td>
                        <td><i>Only available when in ultrasound mode when mouse control is activated</i></td>
                    </tr>
                    <tr>
                        <td>Puase mouse control</td>
                        <td class='td-unbound'>Unbound</td>
                        <td>Middle mouse button</td>
                        <td><i>Only available when in ultrasound mode when mouse control is activated</i></td>
                    </tr>
                </table>
            </div>
            <br>
            <div id='instruction-box-button-container'>
                <button id="instruction-close-button" on:click={() => closeHelp()}>
                    Close Instructions
                </button>
            </div>
        </div>
    </div>

<style>
    th, td {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        padding-right: 1rem;
    }

    .td-unbound {
        color: rgb(129, 129, 129);
    }
    
    #instruction-box {
        background: #000000c9;
        backdrop-filter: blur(10px);
        position: absolute;
        width: 100%;
        height: 100%;
        text-align: left;
        z-index: 102;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #instruction-box-inner {
        position: absolute;
        width: 60%;
        height: 85%;
        top: 5%;
    }

    #instruction-box-table {
        height: 100%;
        width: 100%;
        overflow: auto;
    }

    #instruction-box-button-container {
        width: auto;
        height: 3rem;
        left: 2%;
    }

    #instruction-box-button-container button {
        height: 100%;
        width: 100%;
    }
</style>