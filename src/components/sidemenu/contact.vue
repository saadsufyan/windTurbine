<template>
    <div class="contact box-container anim-container">
        <div class="scroll-container">
            <div class="list content-container">
                <h3>{{ getTranslation("Contact") }}</h3>
                <ul class="list-container">
                    <li class="form-group no-border">
                        <a :href="phoneNumber">
                            <p class="list-name">{{ getTranslation("Emergencyline") }}</p>
                            <p class="list-value">{{ getTranslation("EmergencylineNumber") }}</p>
                        </a>
                    </li>
                    <li class="form-group no-border">
                        <a target="_blank" :href="getTranslation('WebsiteURL')">
                            <p class="list-name">{{ getTranslation("Website") }}</p>
                            <p class="list-value">{{ getTranslation("WebsiteURL") }}/</p>
                        </a>
                    </li>
                </ul>

                <h3>{{ getTranslation("Send ") }} {{ getTranslation("a message") }}</h3>
                <div class="form-group">
                    <select-with-modal id="message-type"
                                       :fieldname="getTranslation('Message subject')"
                                       :options="messageOptions"
                                       :selected="messageType"
                                       @change="setMessageType"/>
                    <i class="bar"></i>
                </div>

                <div class="form-group">
                    <label class="helper-label" for="message-content">
                        <p class="list-name">{{ getTranslation("Message content") }}</p>
                    </label>
                    <textarea name="message-content" rows="5" id="message-content" v-model="messageContent"></textarea>
                    <i class="bar"></i>
                </div>
                <button class="button regular center" @click="sendForm">{{ getTranslation("Send") }}</button>
            </div>
        </div>
    </div>

</template>

<script>
    import SelectWithModal from "../select-with-modal.vue";
    export default {
        name: "Contact",
        data() {
            return {
                messageType: '',
                messageContent: '',
                messageOptions: [],
                hasError: false,
                select: null,
                phoneNumber: '',
            }
        },
        mounted(){
            this.phoneNumber = 'tel:' + this.getTranslation("EmergencylineNumber");
            // Component is loaded; do stuff!
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Contact"));

            this.$store.commit('navbar/showLoading', true);
            window.axios.get('Session/Contact/GetMessageOptions')
                .then(response => {
                    let selectOptions = [];
                    _.each(response.data.GetMessageOptions, (val, idx) => {
                        let obj = {
                            id: val.ID,
                            value: val.DisplayName,
                        };
                        selectOptions.push(obj);
                    });

                    this.messageOptions = selectOptions;
                    this.$store.commit('navbar/showLoading', false);
                })
                .catch(error => {
                    this.$store.commit('navbar/showLoading', false);
                    this.alert(error);
                });
        },
        computed: {
        },
        methods: {
            setMessageType(e) {
                this.messageType = e.selection;
            },
            sendForm() {

                this.hasError = false;
                if (!this.messageType || !this.messageContent) {
                    this.hasError = true;
                    return;
                }

                this.$store.commit('navbar/showLoading', true);

                window.axios.defaults.headers.message = this.messageContent;
                window.axios.put('Session/Contact/'+ this.messageType +'/SendMessage')
                    .then(response => {
                        this.$store.commit('navbar/showLoading', false);
                        this.alert( this.getTranslation("Message successfully sent") );
                    })
                    .catch(error => {
                        this.$store.commit('navbar/showLoading', false);
                        this.alert( error );
                    });
            },
        },
        components: {
            SelectWithModal
        }
    }
</script>
