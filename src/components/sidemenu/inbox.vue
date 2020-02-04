<template>
    <div class="inbox box-container anim-container">
        <div class="scroll-container">
            <messageTemplate v-for="message in messages" :data="message" :key="message.ID" @click="detailView(message.ID, $event)"/>
        </div>
    </div>
</template>

<script>
    import messageTemplate from './inbox-detail-template.vue';
    export default {
        name: "Inbox",
        data() {
            return {
                messages: [],
            }
        },
        mounted(){
            // Component is loaded; do stuff!
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Inbox"));

            window.axios.get('Session/CurrentUser/Inbox')
                .then(response => {
                    this.messages = response.data.UserInboxResult;
                    this.$store.commit('inbox/setData', response.data.UserInboxResult);
                })
                .catch(error => {
                    console.error(error);
                });
        },
        computed: {
        },
        methods: {
        },
        components: {
            messageTemplate: messageTemplate
        }
    }
</script>
