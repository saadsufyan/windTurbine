<template>
    <div class="full-page-loader loading" v-bind:class="loadingScreen">
        <div class="windup-loader"></div>
        <p>
            {{ getTranslation("Loading") }}
        </p>
    </div>
</template>

<script>
    export default {
        data() {
            return {

            }
        },
        mounted() {

        },
        computed: {
            loadingScreen() {
                return (this.$store.state.navbar.showLoading) ? 'visible' : 'hidden';
            },
        }
    }
</script>