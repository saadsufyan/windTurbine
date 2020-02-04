<template>
    <div class="windmill">
        <img src="@/assets/images/windmill/blades.png" class="blades"/>
        <img class="base" src="@/assets/images/windmill/base.png"/>
    </div>
</template>

<script>
    export default {
        props: [
            'hasWindmill',
        ],
        data() {
            return {
                type: this.type,
            }
        },
        mounted() {

        },
    }
</script>
