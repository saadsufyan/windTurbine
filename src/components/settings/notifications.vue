<template>
    <div class="settings box-container">
        <div class="scroll-container">
            <div class="content-container">

                <ul class="notifications-list list-container">
                    <li class="form-group" v-for="notification in NotificationClassification">
                        <label class="header-label no-border">
                            <p>{{ notification.value }}</p>
                        </label>

                        <div class="custom-check" v-for="value in NotificationTypeCodes">
                            <input type="checkbox" v-model="notification.selectedValue" class="radio" :value="value.id" :id="notification.htmlformattedvalue + value.id" :name="notification.value">
                            <label :for="notification.htmlformattedvalue + value.id">
                                <div class="box"><i class="fa fa-check"></i></div>
                                <span>{{ value.value }}</span>
                            </label>
                        </div>
                    </li>
                </ul>
                <button class="button regular center" @click="saveUserNotifications">{{ getTranslation("Save") }}</button>
            </div>

        </div>
    </div>

</template>

<script>
    import windmillClass from '../windmill/windmill.js';
    export default {
        name: "Notifications",
        data() {
            return {
                NotificationTypeCodes: [],
                NotificationClassification: [],
                NotificationSelected: [],
            }
        },
        mounted(){
            // Component is loaded; do stuff!
            this.$store.commit('navbar/showLoading', true);
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Notifications"));

            // Fetch the enumerations, always fetch from API;
            this.fetchEnumerations();
        },
        computed: {
        },
        methods: {
            handleSelectValues(data, prop, dataScope) {
                let arr = [];

                let userNotifications = this.$store.getters['user/getUserNotifications'];

                _.each(data, (value) => {
                    let currentKey = value[prop];
                    if (currentKey != 0) {
                        let obj = {
                            id: currentKey,
                            value: value.DisplayName,
                            htmlformattedvalue: value.DisplayName.replace(/ /g, '-').toLowerCase(),
                            selectedValue: [],
                        };

                        if (dataScope == true) {
                            this.NotificationSelected.push(obj);

                            _.each(userNotifications, (value) => {
                                if (value.NotificationClassificationID == currentKey) {
                                    obj.selectedValue.push(value.ID);
                                }
                            });
                        }

                        arr.push(obj);
                        obj = null;
                    }
                });
                return arr;
            },
            saveUserNotifications() {
                this.$store.commit('navbar/showLoading', true);
                _.each(this.NotificationSelected, (notification) => {
                    let notificationIds = '';

                    if (notification.selectedValue.length > 0) {
                        _.each(notification.selectedValue, (value) => {
                            if (value != 0) {
                                if (value == null) {
                                    value = 0;
                                }
                                if (notificationIds.length > 0) {
                                    notificationIds += ',';
                                }
                                notificationIds += value;
                            }
                        });
                    } else {
                        notificationIds = 0;
                    }

                    window.axios.defaults.headers.notificationtypeids = notificationIds;
                    window.axios.put('Session/CurrentUser/NotificationPreference/'+ notification.id +'/Update', {});

                });

                window.axios.put('/Session/CurrentUser/Update', {})
                    .then( (response) => {
                        let data = response.data;
                        if (data.CurrentUserUpdateResult && data.CurrentUserUpdateResult[0] && data.CurrentUserUpdateResult[0].UpdateResult == 'OK') {
                            this.$store.commit('user/setData', JSON.stringify(data.Session[0]));

                            this.$store.commit('user/setNotificationData', JSON.stringify(data.NotificationPreferences));
                        } else {
                            console.error( data.CurrentUserUpdateResult[0].UpdateResult );
                        }
                        this.$store.commit('navbar/showLoading', false);
                    })
                    .catch( (error) => {
                        this.alert(error);
                        this.$store.commit('navbar/showLoading', false);
                    });
            },
            fetchEnumerations() {
                Promise.all([windmillClass.getEnumeration('NotificationTypeCompactList'), windmillClass.getEnumeration('NotificationClassificationCompactList')])
                    .then(([notificationType, notificationClassifications]) => {

                        this.$store.commit('navbar/showLoading', false);
                        this.NotificationTypeCodes = this.handleSelectValues(notificationType.NotificationTypeCompactList, 'ID', false);
                        this.NotificationClassification = this.handleSelectValues(notificationClassifications.NotificationClassificationCompactList, 'ID', true);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        this.$store.commit('navbar/showLoading', false);
                        this.alert(error);
                    });
            },
        },
        components: {
        }
    }
</script>
