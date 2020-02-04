<template>
    <div class="hexagon-container">
        <div v-bind:class="{ 'ripple mask': isButton }">
            <svg viewBox="0 0 371 331" id="clipsvg">
                <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="hexagon" fill="#61B4E4">
                        <g id="Laag_1">
                            <g id="Group">
                                <path d="M365.806,148.946497 L289.751,17.1419471 C283.815,7.11737566 273.056,0.805608466 261.184,0.805608466 L109.445,0.805608466 C97.573,0.805608466 86.814,7.11737566 80.878,17.1419471 L4.823,148.946497 C-1.113,158.971069 -1.113,171.594603 4.823,181.990455 L80.878,313.795005 C86.814,323.819577 97.573,330.131344 109.445,330.131344 L261.184,330.131344 C273.056,330.131344 283.815,323.819577 289.751,313.795005 L365.806,181.990455 C371.742,171.594603 371.742,158.971069 365.806,148.946497" id="Shape"></path>
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
        <windmill v-if="hasWindmill"/>
    </div>
</template>

<script>
import windmill from '../windmill/windmill.vue';
export default{
    props: [
    	'hasWindmill',
        'isButton',
    	'vWidth',
    	'vHeight',
    ],
    data(){
        return {
        }
    },
    mounted(){

    },
    components: {
        windmill: windmill,
    }
}
</script>
