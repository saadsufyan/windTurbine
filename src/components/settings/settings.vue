<template>
    <div class="settings box-container">
        <div class="scroll-container">
            <div class="content-container">
                <h3>{{ getTranslation("Settings") }}</h3>
                <ul class="list-container">
                    <li class="form-group">
                        <select-with-modal showlabel="true" :fieldname="getTranslation('Timezone')"
                                           :options="TimeZoneCodes" :selected="TimeZoneCode"
                                           @change="setTimeZone"></select-with-modal>
                        <i class="bar"></i>
                    </li>
                    <li class="form-group">
                        <select-with-modal showlabel="true" :fieldname="getTranslation('CultureCode')"
                                           :options="CultureCodes" :selected="CultureCode"
                                           @change="setCultureCode"></select-with-modal>
                        <i class="bar"></i>
                    </li>
                    <li class="form-group">
                        <select-with-modal showlabel="true" :fieldname="getTranslation('Language')"
                                           :options="LanguageCodes" :selected="LanguageCode"
                                           @change="setLanguage"></select-with-modal>
                        <i class="bar"></i>
                    </li>
                    <li class="form-group">
                        <select-with-modal showlabel="true" :fieldname="getTranslation('RotationAnimationSpeed')"
                                           :options="RotationAnimationTypeIDs" :selected="RotationAnimationTypeID"
                                           @change="setRotationID"></select-with-modal>
                        <i class="bar"></i>
                    </li>
                    <li class="form-group">
                        <select-with-modal showlabel="true" :fieldname="getTranslation('CurrencyCodes')"
                                           :options="CurrencyCodes" :selected="CurrencyCode"
                                           @change="setCurrencyCode"></select-with-modal>
                        <i class="bar"></i>
                    </li>
                </ul>

                <!-- @TODO: turn on later when the API supports it -->
                <!--<router-link tag="h3" :to="{ name: 'setting-notifications' }">{{ getTranslation("Notifications") }} <i class="float-right fa fa-angle-right"/></router-link>-->

                <button class="button regular center logout" @click="saveUserData">{{ getTranslation("Save") }}</button>
            </div>

        </div>
    </div>

</template>

<script>
    import windmillClass from '../windmill/windmill.js';
    import SelectWithModal from "../select-with-modal.vue";

    export default {
        name: "Settings",
        data()
        {
            return {
                LanguageCode: '',
                LanguageCodes: [],
                RotationAnimationTypeID: '',
                RotationAnimationTypeIDs: [], // This will never change unless the app is also updated. Static values in this case are easier and stable.
                CultureCode: '',
                CultureCodes: [],
                TimeZoneCode: '',
                TimeZoneCodes: [],
                CurrencyCodes: [],
                CurrencyCode: '',
            };
        },
        mounted()
        {
            // Component is loaded; do stuff!
            this.RotationAnimationTypeIDs = [
                {
                    id: '0',
                    value: this.getTranslation("Power")
                },
                {
                    id: '1',
                    value: this.getTranslation("WindSpeed")
                },
                {
                    id: '2',
                    value: this.getTranslation("RPM")
                },
            ];
            this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Settings"));
            this.TimeZoneCode = this.$store.getters['user/getUserProperty']('TimeZoneCode');
            this.LanguageCode = this.$store.getters['user/getUserProperty']('LanguageCode');
            this.CultureCode = this.$store.getters['user/getUserProperty']('CultureCode');
            this.CurrencyCode = this.$store.getters['user/getUserProperty']('CurrencyCode');
            this.RotationAnimationTypeID = this.$store.getters['user/getUserProperty']('RotationAnimationTypeID');
            this.Email = this.$store.getters['user/getUserProperty']('Email');
            this.username = this.$store.getters['user/getusername'];

            // Fetch the enumerations, always fetch from API;
            this.fetchEnumerations();
        },
        computed: {},
        methods: {
            handleSelectValues(data, prop)
            {
                let arr = [];
                _.each(data, (value) => {
                    let obj = {
                        id: value[prop],
                        value: value.DisplayName,
                        selectedValue: [],
                    };
                    arr.push(obj);
                    obj = null;
                });
                return arr;
            },
            setCurrencyCode(e)
            {
                this.CurrencyCode = e.selection;
//                this.saveUserData();
            },
            setLanguage(e)
            {
//                this.saveUserData();
                this.LanguageCode = e.selection;
            },
            setTimeZone(e)
            {

                this.TimeZoneCode = e.selection;
//                this.saveUserData();
            },
            setCultureCode(e)
            {
                this.CultureCode = e.selection;
//                this.saveUserData();
            },
            setRotationID(e)
            {
                this.RotationAnimationTypeID = e.selection;
//                this.saveUserData();
            },
            saveUserData()
            {
                let self = this;
                this.$store.commit('navbar/showLoading', true);
                window.axios.defaults.headers.LanguageCode = this.LanguageCode;
                window.axios.defaults.headers.TimeZoneCode = this.TimeZoneCode;
                window.axios.defaults.headers.CultureCode = this.CultureCode;
                window.axios.defaults.headers.RotationAnimationTypeID = this.RotationAnimationTypeID;
                window.axios.defaults.headers.CurrencyCode = this.CurrencyCode;
                window.axios.put('Session/CurrentUser/Update', {})
                    .then((response) => {
                        let data = response.data;
                        if (data.CurrentUserUpdateResult && data.CurrentUserUpdateResult[0] && data.CurrentUserUpdateResult[0].UpdateResult == 'OK') {
                            self.$store.commit('user/setData', JSON.stringify(data.Session[0]));
                            self.$store.commit('user/setNotificationData', JSON.stringify(data.NotificationPreferences));
                            //reset local_languages to set languageCode
                            self.$store.commit('languages/setLocalData', {
                                data: data.Session[0].LanguageCode
                            });

                            windmillClass.getAssets()
                                .then((data) => {
                                    self.$store.commit('navbar/changeWindowTitle', self.getTranslation("Settings"));
//                                    self.$store.commit('navbar/showLoading', false);
                                })
                                .catch(err => {
                                    console.error(err);
                                });
                        }

                        setTimeout(function () {
                            self.RotationAnimationTypeIDs = [ // This will never change unless the app is also updated. Static values in this case are easier and stable.
                                {
                                    id: '0',
                                    value: self.getTranslation("Power")
                                },
                                {
                                    id: '1',
                                    value: self.getTranslation("WindSpeed")
                                },
                                {
                                    id: '2',
                                    value: self.getTranslation("RPM")
                                },
                            ];
                            self.$store.commit('navbar/showLoading', false);
                        }, 1500);
                    })
                    .catch((error) => {
                        this.$store.commit('navbar/showLoading', false);
                        console.error(error);
                    });
            },
            fetchEnumerations()
            {
                let culture = windmillClass.getEnumeration('CultureCompactList');
                let language = windmillClass.getEnumeration('LanguageCompactList');
                let timezone = windmillClass.getEnumeration('TimeZoneCompactList');
                let currency = windmillClass.getEnumeration('CurrencyCompactList');

                this.$store.commit('navbar/showLoading', true);
                Promise.all([culture, language, timezone, currency])
                    .then(([culture, language, timezone, currency]) => {
                        this.CultureCodes = this.handleSelectValues(culture.CultureCompactList, 'Code');
                        this.LanguageCodes = this.handleSelectValues(language.LanguageCompactList, 'Code');
                        this.TimeZoneCodes = this.handleSelectValues(timezone.TimeZoneCompactList, 'Code');
                        this.CurrencyCodes = this.handleSelectValues(currency.CurrencyCompactList, 'Code');
                    })
                    .catch(err => {
                        this.$store.commit('navbar/showLoading', false);
                        console.error(err);
                        this.alert(this.getTranslation("ApiError"));
                    });
            },
        },
        components: {
            SelectWithModal
        }
    };
</script>
