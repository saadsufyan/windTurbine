<template>
    <div class="inbox box-container anim-container">
        <div class="scroll-container">
            <messageTemplate :data="messageData" class="open" :class="{'open': isOpen}"/>
        </div>
    </div>
</template>

<script>
    import messageTemplate from './inbox-detail-template.vue';
    export default {
        name: "InboxDetail",
        data() {
            return {
                messages: [],
                isOpen: false,
            }
        },
        mounted(){
            // Component is loaded; do stuff!
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Message"));
        },
        computed: {
            messageData() {
                return this.$store.getters['inbox/getMessageById'](this.$route.params.messageId);
            }
        },
        methods: {
        },
        components: {
            messageTemplate: messageTemplate
        }
    }
</script>
