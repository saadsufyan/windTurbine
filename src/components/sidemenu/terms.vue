<template>
    <div class="terms box-container anim-container">
        <div class="scroll-container">
            <div class="list content-container">
                <h3>{{ getTranslation("Terms") }}</h3>
                <p class="regular-content">{{ getTranslation("AppDisclaimerText") }}</p>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Terms",
        data() {
            return {
            }
        },
        mounted(){
            // Component is loaded; do stuff!
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Terms"));
        },
        computed: {
        },
        methods: {
        },
        components: {
        }
    }
</script>
