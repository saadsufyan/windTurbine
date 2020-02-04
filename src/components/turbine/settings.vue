<template>
    <div class="anim-container hasTabBar settings turbine-details">
        <div class="card">
            <p class="title">
                {{ getTranslation('Price agreements') }}
            </p>

            <p class="sub-title">
                {{ getTranslation('Price per kwh') }}
            </p>

            <div class="form">
                <div class="form-group">
                    <p class="euro-prefix">{{ currencySymbol }}</p>
                    <input type="number" id="pricekWh" class="has-prefix" v-model="turbinePrice">
                    <i class="bar"></i>
                </div>
            </div>
            <button @click="savePrice" class="button regular center">{{ getTranslation('Save') }}</button>
        </div>
        <div class="card">
            <p class="title">
                {{ getTranslation('Prognose') }}
            </p>
            <p class="sub-title">
                {{ getTranslation('Monthly') }}
            </p>

            <div class="form">
                <div class="form-group" v-for="key in datePrognoseList">
                    <label :for="key.month">
                        {{ generateMonth(key.number) }}
                    </label>
                    <input type="number" class="text-right has-affix" :id="key.month" v-model="key.value">
                    <span class="input-affix">kWh</span>
                </div>
            </div>
            <button @click="savePrognose" class="button regular center">{{ getTranslation('Save') }}</button>
        </div>
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';

    export default {
        name: "TurbineSettings",
        data() {
            return {
                dateList: [],
                datePrognoseList: [],
                turbinePrice: '',
            }
        },
        computed: {
            ...mapGetters('windmills', ['getTurbineById']),
            currencyCode() {
                return this.$store.getters['user/getUserProperty']('CurrencyCode') || '';
            },
            currencySymbol() {
                return this.convertCurrencyCodeToSign(this.currencyCode) || '';
            },
        },
        mounted() {
            global.numeral.locale(localStorage.getItem('currentLang'));
            let turbine = this.getTurbineById(this.$route.params.id);
            this.turbine = turbine;
            this.turbinePrice = numeral(turbine.kWhPrice).format('0.00');
            this.turbinePrice = turbine.kWhPrice;

            this.generateDateList();
            this.generateCurrentPrognoseDateList();
        },
        methods: {
            generateMonth(month) {
                let newDate = new Date();
                    newDate.setMonth( month );
                let locale = this.$store.getters['user/getUserProperty']('LanguageCode');
                let monthStr = newDate.toLocaleString(locale, { month: "long" });
                return monthStr;
            },
            generateDateList() {
                for (var i = 1; i < 13; i++) {
                    let newDate = new Date();
                        newDate.setMonth( newDate.getMonth() + i );

                    let month = newDate.toLocaleString('en-EN', { month: "short" });
                    this.dateList.push({month: month, number: newDate.getMonth()});
                }
            },
            generateCurrentPrognoseDateList() {

                window.axios.get('Turbines/'+ this.$route.params.id +'/PrognosisDefaults')
                    .then(response => {
                        this.datePrognoseList = [];
                        if (response.data.PrognosisDefaultsData) {
                            _.each(this.dateList, (val, idx) => {
                                let value = response.data.PrognosisDefaultsData[0][val.month];
                                val.value = value;

                                this.datePrognoseList.push(val);
                            });
                        }
                    })
                    .catch(error => {
                        this.alert(error);
                    });
            },
            preparePrognoseData() {
                let prognoseObject = {};

                _.each(this.datePrognoseList, (val, idx) => {
                    window.axios.defaults.headers[val.month] = val.value;
                });

                return prognoseObject;
            },
            savePrice() {
                this.$store.commit('navbar/showLoading', true);

                window.axios.defaults.headers.kWhprice = this.turbinePrice;
                window.axios.put('Turbines/'+ this.$route.params.id +'/kWhPriceUpdate')
                    .then((response) => {
                        windmillClass.initialiseData()
                            .then( (data) => {
                                // When this promise is resolved, the data should be available through the store
                                this.$store.commit('navbar/showLoading', false);
                            })
                            .catch( (error) => {
                                this.$store.commit('navbar/showLoading', false);
                                console.error(error);
                            });
                    })
                    .catch(error => {
                        this.$store.commit('navbar/showLoading', false);
                        this.alert(error);
                    });
            },
            savePrognose() {
                this.$store.commit('navbar/showLoading', true);
                this.preparePrognoseData();

                window.axios.put('Turbines/' + this.$route.params.id + '/PrognosisDefaults')
                    .then(() => {

                        windmillClass.initialiseData()
                            .then( (data) => {
                                // When this promise is resolved, the data should be available through the store
                                this.$store.commit('navbar/showLoading', false);
                            })
                            .catch( (error) => {
                                this.$store.commit('navbar/showLoading', false);
                                console.error(error);
                            });
                    })
                    .catch(error => {
                        this.$store.commit('navbar/showLoading', false);
                        this.alert(error);
                    });
            },
        },
    }
</script>