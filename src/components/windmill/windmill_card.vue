<template>
    <div v-bind:id="identifier" class="windmill_card card" :class="statusClass" v-observe-visibility="checkVisibility">
        <router-link :to="link" class="link">
            <div class="upper-container">
                <div class="turbine-container">
                    <turbine-with-chart class="small"
                                        :turbine-data="turbineData"
                                        size="1"
                                        :prognosis-data="prognosisData"
                                        :chart-data="donutChartData"/>
                    <div class="notification-icon" v-if="hasNotification" :class="statusClass"></div>
                </div>
                <div class="info-container">
                    <p class="windmill-title">{{ title }} <span v-if="isPark">({{turbineCount}})</span>
                    </p>
                    <span class="status-message" :class="statusClass" v-if="errorMessage">{{ errorMessage }}  <i
                            v-if="hasEngineer" class="icon engineer-icon" :class="statusClass"/></span>
                    <div class="info" v-if="!hasError">
                        <div class="info-col" v-if="showEarnings">
                            <span class="stats-value">{{ currencySymbol }}
                                <count-up-number :number="earnings" :label="earningsCountUpId"></count-up-number>
                            </span>
                        </div>
                        <div class="info-col">
                              <span class="stats-value">
                                  <count-up-number :number="output" :options="countUpDecimalsProduction"
                                                   :label="outputCountUpId"/>
                                  {{ outputLabel}}
                              </span>
                        </div>
                        <div class="stats-col lowercased">
                             <span class="stats-value"><count-up-number :number="windspeed"
                                                                        :options="generateCountUpOptions(windspeed, 1)"
                                                                        :label="windspeedCountUpId"/> {{ getTranslation('WindspeedUnit')
                                 }}</span>
                        </div>
                    </div>
                    <p class="info error-message" v-else>
                        {{ errorDescription }}
                    </p>
                </div>
            </div>
            <div class="lower-container">
                <span class="link-span text-bold">{{linkName}}</span>
            </div>
        </router-link>
    </div>
</template>

<script>
    import Moment from 'moment';
    import {mapGetters} from 'vuex';
    import {extendMoment} from 'moment-range';
    import windmill from '../windmill/windmill.vue';
    import hexagon from '../hexagon/hexagon.vue';
    import windmillClass from '../windmill/windmill.js';
    import turbineWithChart from '../overview-card/turbine-with-chart.vue';
    import CountUpNumber from "../countup-number.vue";

    const moment = extendMoment(Moment);

    export default {
        name: 'WindmillCard',
        props: [
            'data',
            'isPark',
            'errorStatus',
        ],
        mounted()
        {
            let result = this.checkHasWarnings();
            if (result == false) {
                // No errors found, checkWeather
                this.checkWeather();
            }
            this.elementToAnimate = $("#" + this.identifier + ' .blades');

            this.initialize();

            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);


        },
        beforeDestroy()
        {
            //stop the data refreshing interval
            this.clearDataInterval();

            //if this component is destroyed, we remove the eventlisteners
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);

        },
        data()
        {
            return {
                currentWeather: null,
                elementToAnimate: null,
                animate: false,
                animationSpeed: 1,
                rotation: 0,
                hasNotification: false,
                statusClass: '',
                errorMessage: '',
                errorDescription: '',
                hasError: false,
                duration: 0,
                animation: false,
                chartData: null,
                prognosis: 0,
                progData: null,
                refresh: null,
                refreshTime: 30000,
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
            };
        },
        computed: {
            ...mapGetters('windmills', ['getParkById', 'getParks', 'getTurbineById', 'getParkNameById', 'getWeatherByLocation']),
            hasEngineer()
            {
                return this.data.EngineerOnSite || false;
            },
            outputCountUpId()
            {
                return 'output-' + this.identifier;
            },
            earningsCountUpId()
            {
                return 'earnings-' + this.identifier;
            },
            windspeedCountUpId()
            {
                return 'windspeed-' + this.identifier;
            },
            turbineStatus()
            {
                if (localStorage.getItem('turbineStatus') != null) {
                    return JSON.parse(localStorage.getItem('turbineStatus'));
                }

                return {};
            },
            link()
            {
                if (this.data.Turbines) {
                    return (this.data.Turbines.length > 1) ? '/overview/' + this.data.ID : '/turbine/' + this.data.Turbines[0].TurbineID;
                } else {
                    return '/turbine/' + this.data.TurbineID;
                }
            },
            identifier()
            {
                if (this.data.Turbines) {
                    return 'windmillcard-' + this.data.ID;
                } else {
                    return 'windmillcard-' + this.data.TurbineID;
                }
            },
            linkName()
            {
                return this.data.isPark ? this.getTranslation("Moreinfo") : this.getTranslation("Details");
            },
            hasMultipleWindmills()
            {
                return (this.data.Turbines && this.data.Turbines.length > 1);
            },
            turbineCount()
            {
                if (this.data.Turbines) {
                    return this.data.Turbines.length;
                }
                return '';
            },
            hasMessage()
            {
                return this.message;
            },
            mutatedProductionObj(){

                if(this.useProduction){
                    return this.mutateProduction(this.useProduction,true);
                }
                return false;
            },
            output()
            {
                if (this.useProduction > 0) {
                    return this.mutatedProductionObj.production;
                }

                if (this.production) {
                    return this.production.toFixed(2);
                }
                return '';
            },
            useProduction()
            {
                let production = this.data.Production;

                if (this.isPark) {
                    production = this.data.RealTimeProduction;
                }

                if (production <= 0) {
                    production = 0;
                }
                return production;
            },
            outputLabel()
            {
                return this.getTranslation(this.mutatedProductionObj.unit);
            },
            windspeed()
            {
                return this.data.Windspeed;
            },
            currentWeatherData()
            {

                let weatherData = this.$store.getters['windmills/getWeatherByLocation'](this.data.WeatherForecastLocationID);
                this.currentWeather = this.findCurrentWeather(weatherData);
                if (this.data.Windspeed && this.currentWeather) {
                    this.currentWeather.WindSpeed = this.windspeed;
                }
                return this.currentWeather;
            },
            title()
            {
                if (this.data && this.data.DisplayName) {
                    return this.data.DisplayName;

                }
                return '';
            },
            earnings()
            {
                let earnings;
                if (this.data) {
                    if (this.isPark) {
                        if (this.data.earnings) {
                            earnings = parseInt(this.data.earnings);
                        }
                    } else {
                        earnings = parseInt(this.data.Production * this.data.kWhPrice);
                    }
                }
                if (earnings <= 0) {
                    earnings = 0;
                }
                return earnings;

            },
            turbineData()
            {
                return {
                    type: 1,
                    speed: this.windspeed,
                    rawdata: this.data,
                };
            },
            windmillCardID()
            {
                if (this.data) {
                    if (this.isPark) {
                        return this.data.ID;
                    } else {
                        return this.data.TurbineID;
                    }
                }
                return -1;
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
            prognosisData()
            {
                if (this.progData) {
                    return this.progData;
                }
            },
            countUpDecimalsProduction()
            {

                if (this.output) {
                    return this.getCountUpOptions(this.output, this.$store.getters['languages/getCurrentLang']);

                }
                return {
                    decimals: 0,
                    decimal: ',',
                    seperator: '.'
                };
            },
        },
        methods: {
            setDataInterval()
            {
                this.clearDataInterval();
                let $this = this;
                this.refresh = setInterval(function () {
                    $this.fetchPrognosis();

                }, $this.refreshTime);
            },
            initialize()
            {
                this.fetchPrognosis();
                this.setDataInterval();
            },

            fetchPrognosis()
            {
                if (this.isPark) {
                    //park
                    windmillClass.getParkPrognosisById(this.windmillCardID, 15)
                        .then(data => {
                            this.setPrognosisData(data);
                        })
                        .catch((err) => {
                            console.error('error getting prognosis for park with id: ', this.windmillCardID, err);
                        });
                } else {
                    //turbine
                    windmillClass.getTurbinePrognosisById(this.windmillCardID, 15)
                        .then(data => {
                            this.setPrognosisData(data);
                        })
                        .catch((err) => {
                            console.error('error getting prognosis for windmill with id: ', this.windmillCardID, err);
                        });
                }
            },
            //fetch chartData to display prognose.
            fetchChartData()
            {
                if (this.isPark) {
                    //park
                    windmillClass.getParkChartDataById(this.windmillCardID, 'year')
                        .then(this.setChartData)
                        .catch((err) => {
                            console.error('error getting chartData for park with id: ', this.windmillCardID, err);
                        });
                } else {

                    //turbine
                    windmillClass.getTurbineChartDataById(this.windmillCardID, 'year')
                        .then(this.setChartData)
                        .catch((err) => {
                            console.error('error getting chartData for windmill with id: ', this.windmillCardID, err);
                        });
                }
            },
            setPrognosisData(progData)
            {
                if (progData && progData.data && progData.data.PrognosisData) {
                    if (progData.data.PrognosisData[0]) {
                        progData = progData.data.PrognosisData[0].Percentage;
                        this.progData = {
                            size: 1,
                            prognosis: progData,
                            id: this.windmillCardID,
                            production: this.useProduction
                        };
                    }
                }
            },
            /**
             * set windmill chartData and monthly prognosis
             * @param chartData
             */
            setChartData(chartData)
            {
                if (chartData) {
                    chartData = chartData.data;
                    this.chartData = chartData;
                    //take the last index to get the current month, prognosis = 6001
                    if (chartData.ChartData.length) {
                        this.prognosisProduction = chartData.ChartData[chartData.ChartData.length - 1]['1012'];
                        this.prognosis = chartData.ChartData[chartData.ChartData.length - 1]['6001'];//pick the last
                        this.setDonutChartData(this.prognosis, this.prognosisProduction);
                    }

                } else {
                    this.prognosis = 0;
                    this.chartData = null;
                }
            },
            setDonutChartData(prognosis, prognosisProduction)
            {
                let percentages = this.calculatePrognosis(prognosis, prognosisProduction);

                let color = this.statusColors['normal'];

                if (percentages.current <= 25) {
                    color = this.statusColors['error'];
                } else if (percentages.current < 50 && percentages.current > 25) {
                    color = this.statusColors['warning'];
                } else if (percentages.current < 75 && percentages.current >= 50) {
                    color = this.statusColors['normal'];
                } else {
                    color = this.statusColors['positive'];
                }

                this.donutChartData = {
                    datasets: [
                        {
                            data: [percentages.current, percentages.rest],
                            backgroundColor: [color, '#201F27'],
                            borderWidth: 0,
                        },
                    ],
                    labels: [''],

                };
            },
            checkHasWarnings()
            {
                let turbineStatus = this.turbineStatus;

                if (this.isPark) {
                    // Handle Park warning messages
                    let indicator = helpers.getStatusIndicator(this.data.Turbines, this.data.DisplayName);

                    if (indicator == 'warning') {
                        this.hasNotification = true;
                        this.statusClass = "warning";
                        this.errorMessage = this.getTranslation('Warning');
                    } else if (indicator == 'error') {
                        this.hasNotification = true;
                        this.statusClass = 'error';
                        this.errorMessage = this.getTranslation('Error');
                    }
                } else {
                    // Is a single Turbine. Status 2 == 'Actief', 3 == 'Storing'
                    let statusMessage = _.findIndex(turbineStatus, {'ID': this.data.AppTurbineStatus});
                    if (statusMessage && turbineStatus[statusMessage] && turbineStatus[statusMessage].DisplayName) {
                        this.errorMessage = turbineStatus[statusMessage].DisplayName;
                    }

                    let indicator = helpers.getStatusIndicator(this.data);

                    if (indicator == 'warning') {
                        this.statusClass = 'warning';
                        this.errorDescription = this.data.StatusCodeDescription;
                        this.hasNotification = true;
                        this.hasError = true;
                        return true;

                    } else if (indicator == 'error') {
                        this.statusClass = 'error';
                        this.errorDescription = this.data.StatusCodeDescription;
                        this.hasNotification = true;
                        this.hasError = true;
                        return true;
                    }
                }

                return false;
            },
            checkVisibility(isVisible, entry)
            {
                this.toggleWindmill(isVisible);
            },
            checkWeather()
            {
                let weatherData = this.$store.getters['windmills/getWeatherByLocation'](this.data.WeatherForecastLocationID);
                this.currentWeather = this.findCurrentWeather(weatherData);
                if (this.data.Windspeed && this.currentWeather) {
                    this.currentWeather.WindSpeed = this.windspeed;
                }
            },

            findCurrentWeather(data)
            {

                if (data == undefined || data.length < 1) {
                    return false;
                }
                let weather = data.find((value) => {
                    const start = moment.utc(value.TimeFrom);
                    const end = moment.utc(value.TimeThru);
                    const range = moment.range(start, end);
                    let contains = range.contains(moment.utc());
                    return contains;
                });

                if (!weather) {
                    return false;
                }

                weather.WindDirection = weather.WindDirection.toLowerCase();
                weather.Weather = weather.Weather.toLowerCase().replace(' ', '_');

                if (typeof weather.Temperature != 'number') {
                    weather.Temperature = parseInt(weather.Temperature.replace('°', '').trim());
                }
                if (typeof weather.WindSpeed != 'number') {
                    weather.WindSpeed = parseInt(weather.WindSpeed.replace(this.getTranslation('m/s'), '').trim());
                }

                let rotation;
                if (this.isPark) {
                    rotation = helpers.getTurbineRotation(this.data.Turbines);
                } else {
                    rotation = helpers.getTurbineRotation(this.data);
                }
                if (rotation === false) {
                    return false;
                }

                let duration;
                if (this.data.Production > 0) {
                    duration = (this.data.Power / this.data.Production);
                } else {
                    duration = 120;
                }

                // Check the TypeID of rotation.
                // 2 == rotor,
                // 1 == windspeed,
                // 0 == production/power?? (used based on iOS app logic)
                if (this.$store.getters['user/getRotationAnimationTypeID'] == 2) {
                    if (this.data.RotorRPM) {
                        duration = (60 / this.data.RotorRPM);
                    } else if (this.data.RPMRotor) {
                        duration = (60 - this.data.RPMRotor);
                    } else {
                        duration = 15;
                    }
                } else if (this.$store.getters['user/getRotationAnimationTypeID'] == 1) {

                    // 20 == 100% || 10 == 50%
                    // 0.5s == minimal duration (fastest) || 1s == 50%
                    let maxSpeed = 20;
                    if (weather.WindSpeed !== 0) {
                        let percentage = (weather.WindSpeed / maxSpeed);

                        duration = 0.5 / percentage;

                        duration = (20.5 - weather.WindSpeed);
                    } else {
                        duration = 60;
                    }
                }
                if (duration <= 1 || isNaN(duration)) {
                    duration = 1;
                }
                this.duration = duration;
                return weather;
            },
            animateWindmill()
            {

                if (this.rotation > 360) {
                    this.rotation = 0;
                } else {
                    this.rotation = this.rotation + (this.animationSpeed * 1);
                }
            },
            toggleWindmill(resume)
            {
                this.animate = resume;
            },
            /**
             * stop the data refreshing interval (if set)
             */
            clearDataInterval()
            {
                if (this.refresh) {
                    clearInterval(this.refresh);
                }
                this.refresh = null;
            }
        },
        components: {
            CountUpNumber,
            windmill: windmill,
            hexagon: hexagon,
            turbineWithChart,
        },
    };
</script>
