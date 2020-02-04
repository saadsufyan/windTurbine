<template>
    <div class="total-overview card">
        <div class="radial-gradient-block">
            <div class="upper-container row">
                <div class="main-cardinfo stats-holder">
                    <div class="card-description stats-value">{{carddescription}}</div>
                    <div class="stats-label text-light" v-if="!isTurbine">
                        <span v-if="parkCount > 0">
                            <count-up-number :number="parkCount" label="parkCount">{{parkCount}}
                            </count-up-number>
                            <span> {{getTranslation('Windparks')}}</span>
                        </span>
                        <span v-if="turbineCount > 0 && parkCount > 0">|</span>
                        <span v-if="turbineCount > 0">
                            <count-up-number :number="turbineCount"
                                             label="turbineCount"/>
                        <span> {{getTranslation('Turbines')}}</span>
                        </span>
                    </div>
                </div>
                <div class="prognose-holder">
                    <span class="prognose-value text-purple" v-if="rawPrognosis >= 999">></span>
                    <count-up-number class="prognose-value text-purple text-bold"
                                     :number="monthlyOutputPrognose"
                                     label="monthlyOutputPrognose"/>
                    <span class="prognose-value text-purple">%</span>
                    <div class="info-button" @click="showInfo"><i class="fa fa-info"></i></div>
                </div>
            </div>
            <div class="current-statsholder">
                <div class="stats-box left">
                    <count-up-number class="stats-value"
                                     :options="generateCountUpOptions(currentProduction)"
                                     :number="currentProduction"
                                     label="currentProduction"/>
                    <div class="stats-label text-light">{{currentProductionUnit}}
                    </div>
                </div>

                <turbine-with-chart :chart-data="donutChartData"
                                    :turbine-data="turbineData"
                                    :prognosis-data="prognosisData"
                                    size="2">
                </turbine-with-chart>

                <div class="stats-box right">
                    <count-up-number class="stats-value" :options="generateCountUpOptions(currentWindspeed,1)"
                                     :number="currentWindspeed"
                                     label="currentWindspeed"/>
                    <div class="stats-label text-light">{{getTranslation('WindspeedUnit')}}</div>
                </div>
            </div>
        </div>

        <div class="lower-container">
            <div class="stats-holder">
                <div class="stats-box">
                    <count-up-number class="stats-value"
                                     :number="mutatedTotalProduction"
                                     label="totalProduction"
                                     :options="generateCountUpOptions(mutatedTotalProduction)"
                    />
                    <div class="stats-label text-light">{{totalProductionLabel}}</div>
                </div>
                <div class="stats-box" v-if="showEarnings">
                    <count-up-number class="stats-value"
                                     :number="totalEarnings"
                                     :options="generateCountUpOptions(totalEarnings,countUpDecimalsMoney.decimals)"
                                     label="totalEarnings"/>
                    <div class="stats-label text-light" v-html="totalEarningsLabel"></div>
                </div>
                <div class="stats-box">
                    <count-up-number class="stats-value"
                                     :number="co2Reduction"
                                     :options="getCountUpOptions(co2Reduction,0)"
                                     label="co2Reduction"/>
                    <div class="stats-label text-light" v-html="co2ReductionLabel"></div>
                </div>

            </div>
            <button class="action-button" v-if="actionbuttontext" @click="doAction">{{actionbuttontext}}</button>
        </div>
    </div>
</template>
<script>

    import TurbineWithChart from './turbine-with-chart.vue';
    import CountUpNumber from '../countup-number.vue';

    export default {
        name: 'overview-card',
        props: ['overviewdata', 'carddescription', 'actionbuttontext'],
        /**
         * overviewCardData =
         *
         *  {
                    currentWindspeed: realTime average windspeed,
                    currentProduction: realTime total production(all parks or turbines together),
                    totalEarnings: (chartdata) earnings this month (over all parks or turbines in park),
                    totalProduction: (chartdata )production this month (over all parks or turbines in a park),
                    totalCo2Reduction: 0,
                    prognose: ,
                    totalParkCount: parkData.totalParkCount,
                    totalTurbineCount: parkData.totalTurbineCount,
                }
         */


        data()
        {
            return {
                countUpDecimalsMoney: {
                    decimals: 0,
                    decimal: ',',
                    separator: '.'
                },
                statusColors: {
                    'unknown': '#fff',
                    'positive': '#3ACA60',
                    'normal': '#8A42AE',//normal
                    'error': '#FF688B',//error
                    'warning': '#FFD368'  //no connection
                },
                monthlyOutputPrognose: 0,
                rawPrognosis: 0,
                donutChartData: {
                    datasets: [
                        {
                            data: [0, 100],
                            backgroundColor: ['#fff', '#201F27'],
                            borderWidth: 0,
                        },
                    ],
                    labels: [''],
                },
                totalProduction: 0,
                prognosis: 0,
                progData: null,
            };
        },
        components: {
            CountUpNumber,
            TurbineWithChart,

        },
        computed: {
            prognosisData()
            {
                if (this.progData) {
                    return this.progData;
                }
            },
            emptyValue()
            {
                return '-';
            },
            overviewcardData()
            {
                return this.overviewdata || false;
            },
            id()
            {
                return parseInt(this.$route.params.id) || -1;
            },
            overviewdataId()
            {
                return this.overviewcardData.ID || -1;
            },
            kwhPrice()
            {
                let price = 0;
                if (this.isTotal) {
                    price = this.overviewcardData.rawdata.average.kWhPrice;

                } else if (this.isPark) {
                    price = this.overviewcardData.rawdata.averageKwHPrice;

                } else {
                    price = this.overviewcardData.rawdata.kWhPrice;

                }

                return price;

            },
            totalEarnings()
            {
                if (this.mutatedTotalProduction > 0 && this.kwhPrice) {

                    let mutated = this.mutateMoney(this.totalProduction * this.kwhPrice);
                    if (mutated.dividingUnit > 1) {
                        return mutated.value;
                    }

                    return mutated.raw;
                }

                return 0;

            },
            totalEarningsLabel()
            {
                if (this.mutatedTotalProduction > 0 && this.kwhPrice) {
                    let mutated = this.mutateMoney(this.totalProduction * this.kwhPrice);
                    if (mutated.dividingUnit > 1) {
                        this.countUpDecimalsMoney.decimals = 1;
                        return this.getTranslation('TotalMonth') + ` ${this.currencySymbol}<br/>(x ${mutated.unit})`;
                    }
                }
                return this.getTranslation('TotalMonth') + ` ${this.currencySymbol}`;
            },
            co2Factor()
            {
                let factor = this.$store.getters['windmills/getCo2Factor'];
                if (factor) {
                    return factor;
                }
                return false;
            },
            co2Reduction()
            {

                if (this.totalProduction <= 0) {
                    return 0;
                }

                if (this.totalProduction && this.co2Factor) {
                    return this.mutatedTotalProductionObj.production * this.co2Factor;
                }

                return 0;
            },
            co2ReductionLabel()
            {
                if (this.mutatedTotalProductionObj.production > 0 && this.kwhPrice) {
                    let mutated = this.mutateMoney(this.mutatedTotalProductionObj.raw * this.kwhPrice);
                    if (mutated.dividingUnit > 1) {
                        return this.getTranslation('TotalMonth') + ' ' + this.getTranslation('Ton') + ' ' + this.getTranslation('Co2reduction') + ' <br/>(x ' + this.getTranslation(mutated.unit) + ')';
                    }
                }
                return this.getTranslation('TotalMonth') + ' ' + this.getTranslation('Ton') + ' ' + this.getTranslation('Co2reduction');
            },
            mutatedTotalProductionObj()
            {
                if (this.totalProduction > 0) {
                    return this.mutateProduction(this.totalProduction);
                }
                return {
                    production: 0,
                    raw: 0,
                    unit: this.getTranslation('kWh'),
                    dividingUnit: 0
                };

            },
            mutatedTotalProduction()
            {
                if (this.totalProduction > 0) {
                    return this.mutatedTotalProductionObj.production;
                }

                return 0;
            },
            totalProductionLabel()
            {
                return this.getTranslation('TotalMonth') + ' ' + this.getTranslation(this.mutatedTotalProductionObj.unit);
            },
            currentProduction()
            {
                return this.overviewcardData.currentProduction;
            },
            currentProductionUnit()
            {
                return this.overviewcardData.currentProductionUnit || this.getTranslation('kWh');
            },
            currentWindspeed()
            {
                if (this.overviewcardData.rawdata && this.overviewcardData.rawdata.Connection == 0) {
                    return '--';
                }
                return this.overviewcardData.currentWindspeed || 0;
            },
            parkCount()
            {
                return this.overviewcardData.totalParkCount || 0;
            },
            turbineCount()
            {
                return (this.$store.getters['windmills/getTurbines'].length) ? this.$store.getters['windmills/getTurbines'].length : '-';
            },
            currentStatus()
            {
                return this.turbineData.status || 1;

            },
            turbineData()
            {
                return {
                    type: 1,
                    speed: this.currentWindspeed,
                };
            },
            isTurbine()
            {
                return !this.isPark && !this.isTotal;
            },
            isPark()
            {
                return this.overviewcardData.isPark == true && this.overviewcardData.isTotal == false;
            },
            isTotal()
            {
                return this.overviewcardData.isTotal == true && this.overviewcardData.isPark == false;
            },
            currencyCode()
            {
                return this.$store.getters['user/getUserProperty']('CurrencyCode') || '';
            },
            currencySymbol()
            {
                return this.convertCurrencyCodeToSign(this.currencyCode) || '';
            },
            showEarnings()
            {
                return this.$store.getters['ui/getUIByItemCode']('Financials');
            },
        },
        methods: {
            showInfo()
            {
                this.alert('', this.getTranslation('Prognoseinfotext'));
            },
            doAction()
            {
                this.$emit('onActionbutton');
            },
            //fetch chartData to display prognose.
            fetchPrognosis(overviewData)
            {
                if (!overviewData.isPark && overviewData.isTotal) {
                    //instead of calling userPrognosis we use the prognosisData we get from within overview/overview.vue
                    this.setPrognosisData(overviewData.rawdata.userPrognosis);
                    this.totalProduction = overviewData.rawdata.userPrognosis.Production;
                } else if (this.isPark) {
                    //park
                    windmillClass.getParkPrognosisById(overviewData.ID, 15)
                        .then((result) => {
                            if (result.data.PrognosisData && result.data.PrognosisData.length) {
                                this.setPrognosisData(result.data.PrognosisData[0]);
                                this.totalProduction = result.data.PrognosisData[0].Production;
                            }
                        })
                        .catch((err) => {
                            console.error('error getting prognosis for park with id: ', this.windmillCardID, err);
                        });
                } else {
                    //turbine
                    windmillClass.getTurbinePrognosisById(overviewData.ID, 15)
                        .then((result) => {
                            if (result.data.PrognosisData && result.data.PrognosisData.length) {
                                this.setPrognosisData(result.data.PrognosisData[0]);
                                this.totalProduction = result.data.PrognosisData[0].Production;

                            }
                        })
                        .catch((err) => {
                            console.error('error getting prognosis for windmill with id: ', this.windmillCardID, err);
                        });
                }
            },
            setPrognosisData(progData)
            {
                if (progData) {

                    this.rawPrognosis = progData.Percentage;

                    //set max to 999
                    if (progData.Percentage > 999) {
                        progData.Percentage = 999;
                    }

                    //this is the number we use as display percentage (maxed to 999)
                    this.monthlyOutputPrognose = progData.Percentage;

                    this.progData = {
                        prognosis: progData.Percentage,
                        id: 'overview',
                        production: this.mutateProduction(progData.Production).production
                    };

                }
            },
        },

        watch: {
            'overviewdata'(newValue)
            {
                if (newValue) {
                    this.fetchPrognosis(newValue);
                }

            },
        },
    };
</script>