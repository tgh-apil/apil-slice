<script>
    import { modelTitle, modelPoster } from '../stores.js';
</script>

<div id='title-box-container'>
    <div id='title-box-inner'>
        <div>
            <h2>
                {$modelTitle}
            </h2>
        </div>
        <div>
            <p>
                Posted by: <b>{$modelPoster}</b>
            </p>
        </div>
    </div>
</div>

<style>
    #title-box-inner {
        width: 100%;
        margin: 0 auto;
    }

    #title-box-inner h2 {
        color: #00acac;
    }
</style>