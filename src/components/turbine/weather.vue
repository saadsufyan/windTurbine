<template>
    <div class="anim-container weatherTab hasTabBar">
        <div class="header">
            <div class="header-content">
                <div class="content-left">
                    <div class="header-title">{{ getTranslation('Weather') }}</div>
                </div>
            </div>
        </div>
        <div class="tab-holder">
            <div class="outerGraphWrapper">
                <div class="graphWrapper">
                    <statsgraph chart-id="statsgraph" class="graphAreaWrapper" :chart-data="graphdata"
                                :options="graphoptions" ref="statsgraph"
                                v-on:resizedGraphWidth="resizeGridHolder">
                    </statsgraph>
                    <div class="gridholder">
                        <div class="grid">
                            <div class="gridcolumn" v-for="(w, key) in gridData">
                                <div class="border-right"></div>
                                <div class="toppart">
                                    <div class="weather">
                                        <div class="weatherIcon" :class="w.weather.icon"></div>
                                        <div class="temperature">{{ w.weather.temperature }}&#176;</div>
                                    </div>
                                </div>
                                <div class="middlepart" :class="elementClass(key)">
                                    <div class="wind"><i :style="rotateWindIcon(w.wind.rotation)"></i></div>
                                    <div class="windspeed">
                                        {{ w.wind.speed }} <br/> <span>{{getTranslation('m/s')}}</span>
                                    </div>
                                </div>
                                <div class="bottompart">
                                    <div class="time">
                                        <div class="hour">{{w.time.hour}}</div>
                                        <div class="date">{{w.time.date}}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="scalesHolderLeft" class="staticScalesHolder holder-left">
                    <div class="scales-border"></div>
                    <div id="scalesContainer"></div>
                </div>

            </div>
        </div>
    </div>
</template>
<script>
    import StatsGraph from '../graph/weathergraph.vue';
    import Windmill from '../../components/windmill/windmill.js';

    import Moment from 'moment';

    export default {
        name: "WeatherTurbine",
        data(){
            let self = this;
            return {
                turbinedata: null,
                graphdata: {},
                xLabels: [],
                graphoptions: {
                    animation: {
                        duration: 1,
                        onComplete: function () {
                            let chartInstance = this.chart,
                                ctx = chartInstance.ctx;
                            self.ctx = ctx;

                            this.data.datasets.forEach(function (dataset, i) {

                                let meta = chartInstance.controller.getDatasetMeta(i);
                                meta.data.forEach(function (bar, index) {
                                    let idxVal = dataset.data[index];
                                    let singleTickHeight = bar._yScale.height / bar._yScale.max;
                                    let height = (idxVal * singleTickHeight);
                                    if (index == 0) {
                                        $('.gap-colors.start').height(height);
                                        $('.gap-colors.start').css({'top': '-'+height+'px'});
                                    } else if ( index == meta.data.length - 1 ) {
                                        $('.gap-colors.end').height(height);
                                        $('.gap-colors.end').css({'top': '-'+height+'px'});
                                    }

                                    $('.winddata-' + index).css({'bottom' : (height + (singleTickHeight * 3.25)) + 'px'});
                                });
                            });
                        },
                    },
                    responsive: false,
                    maintainAspectRatio: false,
                    legend: {//no legend displayed (has features like hiding/showing line/bar graph
                        display: false,

                    },
                    layout: {
                        padding: 0
                    },
                    elements: {
                        line: {
                            fill: true,
                            borderColor: '#234464',
                            borderWidth: 2,
                            lineTension: 0.15,
                        },
                        point: {
                            display: true,
                            backgroundColor: '#234464',
                            radius: 0,
                            hitRadius: 0,
                            borderColor: '#234464',

                        }
                    },
                    tooltips: {
                        enabled:false
                    },
                    scales: {
                        yAxes: [
                            {
                                id: 'lineY',
                                type: 'linear',
                                position: 'left',
                                display: false,
                                ticks: {
                                    display: false,
                                    beginAtZero: true,
                                    fontColor: '#FFFFFF',
                                    fontSize: 14,
                                    min: 0,
                                    max: 30,
                                    stepSize: 2,
                                    mirror: false,
                                    maxRotation: 0,
                                    minRotation: 0,
                                },
                                gridLines: {
                                    display:false,
                                },
                                afterUpdate(scales){
                                    self.drawStaticScales(scales, 'left');
                                },
                            }
                        ],
                        xAxes: [
                            {
                                id: 'xAxe',
                                type: 'category',
                                gridLines:{
                                    display:false
                                },
                                ticks: {
                                    display: false,
                                    fontColor: '#FFFFFF',
                                    fontSize: 14,
                                    maxRotation: 90,
                                    minRotation: 90,
                                },
                                zeroLineColor:'#FFFFFF'
                            }
                        ]
                    }
                },
                refresh: null,
            }
        },
        mounted(){
            this.initChart();
            this.setDataInterval();

            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);

        },
        beforeDestroy()
        {
            this.clearDataInterval();
            //if this component is destroyed, we remove the eventlisteners
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        computed: {
            turbineId(){
                return this.$route.params.id;
            },
            currentWeather() {
                return this.getCurrentWeather(this.turbinedata);
            },
            gridData(){
                return this.generateGridData(this.turbinedata);
            }
        },
        methods: {
            rotateWindIcon(rotation) {
                return 'transform: rotate('+ rotation +'deg)';
            },
            elementClass(idx) {
                return 'winddata-' + idx;
            },
            initChart(){
                this.setRealTimeData();
                this.setDataInterval();
            },

            setDataInterval(){

                this.clearDataInterval();
                let self = this;
                this.refresh = setInterval(function () {

                    self.setRealTimeData();
                }, 5 * (60 * 1000));//every 5 min data refresh?

            },
            /**
             * based on overall weatherdata we can find the correct slot and extract the temperature, wind direction etc.
             */
            getCurrentWeather(weatherdata){

                if (weatherdata) {//find currentWeather based on timeFrom/timeThru

                    let currentWeather = weatherdata.find((obj) => {
                        const start = Moment.utc(obj.TimeFrom);
                        const end = Moment.utc(obj.TimeThru);
                        const range = Moment.range(start, end);
                        return range.contains(Moment.utc());
                    });

                    if (currentWeather) {


                        return {
                            weather: {
                                type: currentWeather.Weather,
                                icon: currentWeather.Weather.toLowerCase().trim().replace(/\s+/, '_')
                            },
                            wind: {
                                direction: currentWeather.WindDirection.toLowerCase(),
                                speed: parseInt(currentWeather.WindSpeed.replace(this.getTranslation('m/s'), '').trim())
                            },
                            temperature: parseInt(currentWeather.Temperature),
                            tempSymbol: '°'

                        }
                    }
                }

                return {
                    weather: {
                        type: '-',
                        icon: ''
                    },
                    wind: {
                        direction: '-',
                        speed: '-'
                    },
                    temperature: '-',
                    tempSymbol: '°',
                }
            },
            /**
             * return promise
             */
            setRealTimeData(){
                let self = this;

                Windmill.getTurbineWeatherById(this.turbineId)
                    .then((response) => {
                        //this also contains weather forecast data.
                        if (response.result) {
                            self.turbinedata = response.weather;
                            self.loadGraph(response.weather);
                        } else {
                            return false;
                        }
                    })
                    .catch((err) => {
                        console.error('catched set realtime weather data -- ', err);
                    });
            },

            /**
             * @param {Object} data {stats,meta}
             */
            loadGraph(data){

                if (!data) {
                    if (this.turbinedata == null) {
                        return false;
                    } else {
                        data = this.turbinedata;
                    }
                }


                this.generateGridData(data);

                let datasets = this.generateDataSets(data);

                this.graphdata = {
                    type: 'bar',//overall type, must be bar to be able to put in line and bar chart.
                    labels: this.xLabels,
                    datasets: datasets
                };
            },

            generateDataSets(weatherdata){

                let gradientHeight = window.innerHeight / 1.5;

                let gradient = this.ctx.createLinearGradient(0, 0, 0, gradientHeight);
                gradient.addColorStop(0, 'rgba(80,168,180,100)');
                gradient.addColorStop(1, 'rgba(41,39,53,0)');

                let temperature = {
                    type: 'line',
                    label: 'temperature',
                    lineTension: 0.25,
                    borderColor: '#50A8B4',
                    pointBackgroundColor: '#50A8B4',
                    backgroundColor: gradient,
                    fill: true,
                    data: [],
                    ylabels: [],
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min: 0,
                                    max: 35,
                                }
                            }]
                        }
                    }
                };

                let windspeed = {
                    type: 'line',
                    label: 'windspeed',
                    backgroundColor: '#add4e7',
                    borderColor: '#50A8B4',
                    pointBackgroundColor: '#50A8B4',
                    fill: true,
                    lineTension: 0.25,
                    data: [],
                    ylabels: []
                };
                //this is required to force the data points to be set to the center of the grid columns.
                //else the data points will be set on the grid lines.
                let barchart = {
                    type:'horizontalBar',
                    data:[],
                    label:'fakebar',
                    barThickness:60,
                };

                let highestSpeed = 0;
                for (let i in weatherdata) {
                    let temp = parseInt(weatherdata[i].Temperature.replace('°', '').trim());

                    let speed = parseInt(weatherdata[i].WindSpeed.replace('°', '').trim());
                    if (speed > highestSpeed) {
                        highestSpeed = speed;
                    }

                    temperature.data.push(speed);
                    temperature.ylabels.push(speed);

                }
                this.graphoptions.scales.yAxes[0].ticks.max = highestSpeed + 5;

                return [temperature, windspeed, barchart];
            },
            resizeGridHolder(data){
                $('.gridholder').width(data.width);
            },
            generateGridData(weatherdata){
                let griddata = [];
                let set = {};
                let xLabels = [];
                /*= set example: {
                 weather: {
                 type: '-',
                 icon: ''
                 },
                 wind: {
                 direction: '-',
                 speed: '-'
                 },
                 time:{
                 hour:,
                 date:
                 }
                 temperature: '-',
                 tempSymbol: '°',
                 };*/

                if (weatherdata) {
                    for (let i in weatherdata) {

                        set.temperature = parseInt(weatherdata[i].Temperature.replace('°', '').trim());
                        set.tempSymbol = '°';

                        set.wind = {};
                        set.wind.speed = parseInt(weatherdata[i].WindSpeed.replace('°', '').trim());
                        set.wind.direction = weatherdata[i].WindDirection.toLowerCase();
                        set.wind.rotation = weatherdata[i].WindDirectionDegrees;

                        set.weather = {};
                        set.weather.temperature = Math.ceil(set.temperature);
                        set.weather.type = weatherdata[i].Weather;
                        set.weather.icon = weatherdata[i].Weather.toLowerCase().trim().replace(/\s+/g, '_');//replace whitespace with underscore

                        set.time = {};
                        let time = new Date(weatherdata[i].TimeFrom);
                        let hours = (time.getHours() < 10) ? '0' + time.getHours() : time.getHours();
                        let minutes = (time.getMinutes() < 10) ? '0' + time.getMinutes() : time.getMinutes();
                        set.time.hour = hours + ':' + minutes;

                        let day = time.getDate();

                        let locale = this.$store.getters['user/getUserProperty']('CultureCode');
                        let month = time.toLocaleString(locale, { month: "short" });

                        set.time.date = day + ' ' + month;

                        xLabels.push(weatherdata[i].TimeFrom);
                        time = day = month = null;

                        griddata.push(set);
                        set = {};
                    }

                    this.xLabels = xLabels;
                }
                return griddata;
            },

            /**
             * draw static scales on different canvas, outside the main canvas
             * @param scales
             * @param leftOrRight
             * @returns {boolean}
             */
            drawStaticScales(scales){
                if (!scales) {
                    return false;
                }

                let scalesList = document.getElementById("scalesHolderLeft");
                let scalesContainer = document.getElementById("scalesContainer");

                let copyWidth = scales.width;
                let copyHeight = scales.height + 10;
                let scaleHeight = copyHeight + 25;

                $(scalesContainer).height(scaleHeight);

                let itemDistance = (copyHeight / scales.ticks.length) - 7;

                let items = '<ul class="staticScales scalesY left" style="height: '+ scaleHeight +'px;" height="' + scaleHeight + '" width="' + copyWidth + '">';
                for (let t in scales.ticks) {
                    if (t == scales.ticks.length - 1) {
                        itemDistance = 0;//last one no margin-bottom
                    }
                    items += '<li class="scaleItem" style="">' + scales.ticks[t] + '</li>';

                }

                //set as html.
                $(scalesContainer).html(items);
            },
            clearDataInterval(){

                if(this.refresh){
                    clearInterval(this.refresh);
                }
                this.refresh = null;
            }
        },

        components: {
            statsgraph: StatsGraph

        }
    }
</script>