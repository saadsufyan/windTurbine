<template>
    <div class="message-container" @click="detailView(data.ID, $event)" :style="visibilityStyle">
        <div class="content">
            <div class="status">
                <span class="status-indicator" v-if="unread(data)"></span>
            </div>
            <p class="header">
                <span class="date">{{ renderDate(data.UTCDate) }}</span> <br/>
                {{ data.Subject }} <br/>
            </p>
            <div class="body">
                <p>{{ data.Body }}</p>
            </div>
        </div>
        <div class="footer">
            <span v-if="!openMessage">{{ getTranslation("Read more") }}</span>
            <span v-if="openMessage" @click="deleteMessage(data.ID)" class="delete">{{ getTranslation("Delete") }}</span>
        </div>
    </div>
</template>
<script>
    export default {
        name: "InboxDetail",
        props: ['data'],
        data() {
            return {
                visibilityStyle: true,
                messages: [],
                openMessage: false,
            }
        },
        mounted(){
            // Component is loaded; do stuff!
            if (this.$route.name == 'inbox-detail') {
                // Send read status to API
                window.axios.put('Session/CurrentUser/Inbox/'+ this.$route.params.messageId +'/MarkAsRead')
                    .catch(error => {
                        console.error(error);
                    });

                this.openMessage = true;
            }
        },
        computed: {
            messageData() {
                return this.$store.getters['inbox/getMessageById'](this.$route.params.messageId);
            }
        },
        methods: {
            unread(obj) {
                if (obj.UTCReadDate) {
                    return false;
                }
                return true;
            },
            deleteMessage(id) {

                window.axios.put('Session/CurrentUser/Inbox/' + id + '/Delete', {})
                    .then(res => {
                        if (res.Error) {
                            console.error(res);
                        } else {
                            this.$router.replace({name: 'inbox'});
                        }
                    })
                    .catch(err => {
                        console.error(err);
                    })

            },
            renderDate(dateY) {
                let date = new Date(dateY),
                    locale = this.$store.getters['user/getUserProperty']('CultureCode'),
                    month = date.toLocaleString(locale, { month: "long" });

                let day = date.getDate();
                let year = date.getFullYear();

                return day + ' ' + month + ', ' + year;
            },
            detailView(id,e) {
                if (this.$route.name != 'inbox-detail') {
                    let $this = this;
                    $this.openMessage = true;
                    let targetContainer = e.target.closest('.message-container');

                    let realHeight = $(targetContainer).find('.body p').outerHeight();

                    $(targetContainer).addClass('open');
                    $(targetContainer).find('.body').css({'height': realHeight, 'z-index': 999999});

                    let spacing = $(targetContainer).offset().top - (56 + 20);

                    TweenMax.to($(targetContainer), .275, {
                       y: '-' + spacing,
                    });

                    TweenMax.to($(targetContainer).siblings(), .225, {
                        y: "-100px", opacity: 0, ease: Power2.easeOut, onComplete: (evt) => {
                                $this.$router.push( { name: 'inbox-detail', params: {'messageId': id} } );
                        }
                    });
                }
            },
        },
        components: {
        }
    }
</script>