<template>
    <div class="anim-container statisticsTab hasTabBar">
        <div class="stats-header stats-header-with-tabs">
            <div class="main-cardinfo stats-holder">
                <div class="card-description stats-value">{{carddescription}}</div>
            </div>
            <div class="selectactivetab">
                <select-with-modal showlabel="false" fieldname="activeTab"
                                   :options="intervalOptions"
                                   :selected="initialTab"
                                   @change="setActiveTab"/>
            </div>
        </div>
        <div class="tab-holder statistics-holder">
            <div class="selection-data-holder">
                <div class="selection-data-item">
                    <div class="flexbox-h">
                        <div class="selection-data-item-value text-purple">
                            <count-up-number :number="selectedWindspeed"
                                             :options="generateCountUpOptions(selectedWindspeed,1)"
                                             label="selectedWindspeed">
                            </count-up-number>
                        </div>
                        <div class="selection-data-item-label-holder">
                            <div class="selection-data-item-label">{{getTranslation('WindSpeed')}}</div>
                            <div class="selection-data-item-label selection-data-item-label-unit">
                                {{selectedWindspeedUnit}}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="selection-data-item">
                    <div class="flexbox-h">
                        <div class="selection-data-item-value text-aquamarine">
                            <count-up-number :number="selectedProduction"
                                             :options="generateCountUpOptions(selectedProduction)"
                                             label="selectedProduction">
                            </count-up-number>
                        </div>
                        <div class="selection-data-item-label-holder">
                            <div class="selection-data-item-label">{{getTranslation('Production')}}</div>
                            <div class="selection-data-item-label selection-data-item-label-unit">
                                {{selectedProductionUnit}}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="selection-data-item">
                    <div class="flexbox-h">
                        <div class="selection-data-item-value text-white"><span>{{currencySymbol}} </span>
                            <count-up-number :number="mutatedSelectedMoney"
                                             :options="generateCountUpOptions(mutatedSelectedMoney,0)"
                                             label="selectedEarnings">
                            </count-up-number>
                            <p class="mutatedUnit" v-if="mutatedSelectedMoneyObj.dividingUnit > 1">
                                {{ mutatedSelectedMoneyUnit }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="outerGraphWrapper">
                <div class="graphWrapper">
                    <statsgraph chart-id="statsgraph"
                                class="graphAreaWrapper"
                                :chart-data="graphdata"
                                :options="graphoptions"
                                :spacing="spacing"
                                ref="statsgraph"
                                @resizedGraphWidth="resizeGridHolder"
                    >
                    </statsgraph>
                    <div class="gridholder">
                        <div class="grid">
                            <div class="gridcolumn" v-for="(s, key) in htmlGridData">
                                <div class="toppart"></div>
                                <div class="middlepart"></div>
                                <div class="bottompart">
                                    <div class="time">
                                        <div class="hour">{{s.time.top}}</div>
                                        <div class="date">{{s.time.bottom}}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="scalesHolderLeft" class="staticScalesHolder holder-left"></div>
                <div id="scalesHolderRight" class="staticScalesHolder holder-right"></div>
                <div class="graphLegendHolder"></div>
            </div>
        </div>
    </div>
</template>
<script>
    import StatsGraph from '../graph/statsgraph.vue';
    import Windmill from '../../components/windmill/windmill.js';
    import Moment from 'moment';
    import CountUpNumber from '../../components/countup-number.vue';
    import SelectWithModal from "../select-with-modal.vue";
    import DropdownWithModal from '../../components/dropdown-with-modal.vue';

    export default {
        name: "StatisticsTurbine",
        data()
        {
            let self = this;
            return {
                showDay: this.$store.getters['ui/getUIByItemCode']('TurbineStatDay'),
                showMonth: this.$store.getters['ui/getUIByItemCode']('TurbineStatMonth'),
                showYear: this.$store.getters['ui/getUIByItemCode']('TurbineStatYear'),
                showTotal: this.$store.getters['ui/getUIByItemCode']('TurbineStatTotal'),
                activeTab: 'day',
                turbinedata: {
                    day: null,
                    month: null,
                    year: null,
                    total: null,
                },
                graphTypes: {
                    1012: 'bar',
                    1020: 'line',
                    6001: 'bar',
                    'earnings': 'bar',
                },
                graphColors: {
                    scales: {
                        grid: {
                            color: '#666D7C',
                        },
                        y_left: {
                            color: '#666D7C',
                        },
                        y_right: {
                            color: '#666D7C',
                        },
                        x: {
                            color: '#666D7C',
                        },
                    },
                    line: {
                        color: '#8A42AE',
                        fillColor: '#8A42AE',
                        hover: {
                            color: '#8A42AE',
                        },
                        selected: {
                            color: '#8A42AE',
                            fillColor: '#8A42AE',
                            borderColor: '#8A42AE',
                        },
                        border: {
                            color: '#8A42AE',
                        },
                    },
                    bar: {
                        color: 'rgba(80,168,180,1)',
                        fillColor: 'rgba(80,168,180,1)',
                        border: {
                            color: '#50A8B4',
                            style: 'solid',
                            width: 1,
                        },
                        selected: {
                            color: '#fff',
                            fillColor: '#fff',
                            borderColor: '#fff',
                        },
                    },
                    bar2: {
                        color: 'rgba(46,90,96,1)',
                        fillColor: 'rgba(46,90,96,0.42)',

                        border: {
                            color: 'rgb(100, 211, 226)',
                            style: 'dashed',
                            width: 1,
                        },
                        selected: {
                            color: '#fff',
                            fillColor: 'rgba(46,90,96,0.42)',
                            borderColor: '#fff',
                        },
                    },
                },
                spacing: 50,
                selectedData: false,//the data we clicked on in graph
                graphdata: {},
                hasPrognose: true,
                labelObjs: [],
                htmlGridData: [],
                refresh: null,
            };
        },
        mounted()
        {
            this.initChart();
            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        beforeDestroy()
        {
            this.clearDataInterval();
            //if this component is destroyed, we remove the eventlisteners
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        computed: {
            initialTab()
            {
                if (this.$store.getters['ui/getUIByItemCode']('TurbineStatYear')) {
                    return 'year';
                }
                if (this.$store.getters['ui/getUIByItemCode']('TurbineStatMonth')) {
                    return 'month';
                }
                if (this.$store.getters['ui/getUIByItemCode']('TurbineStatDay')) {
                    return 'day';
                }
                if (this.$store.getters['ui/getUIByItemCode']('TurbineStatTotal')) {
                    return 'total';
                }
            },
            turbineId()
            {
                return parseInt(this.$route.params.id);
            },
            turbine()
            {
                if (this.$route.params.id) {
                    let turbine = this.$store.getters['windmills/getTurbineById'](this.turbineId);
                    if (turbine) {
                        return turbine;
                    }
                }

                return false;
            },
            turbineData()
            {
                if (this.turbine) {
                    return this.turbine;
                }
                return false;
            },
            currencyCode()
            {
                return this.$store.getters['user/getUserProperty']('CurrencyCode') || '';
            },
            currencySymbol()
            {
                return this.convertCurrencyCodeToSign(this.currencyCode) || '';
            },
            kwhPrice()
            {
                if (this.turbineData) {
                    return this.turbineData.kWhPrice;
                }
                return 0;
            },
            graphoptions()
            {
                let self = this;
                return {
                    responsive: true,
                    maintainAspectRatio: false,
                    legend: {//no legend displayed (has features like hiding/showing line/bar graph
                        display: false,
                    },
                    legendCallback: function (chart) {
                        let text = [];
                        text.push('<ul class="chartLegend ' + chart.id + '-legend">');
                        for (let i = 0; i < chart.data.datasets.length; i++) {

                            let legendColorIndicator = chart.data.datasets[i].backgroundColor;
                            text.push('<li class="legend-item"><span style="background-color:' + legendColorIndicator + '"></span>');
                            if (chart.data.datasets[i].label) {
                                text.push(chart.data.datasets[i].label);
                            }
                            text.push('</li>');
                        }
                        text.push('</ul>');
                        return text.join("");
                    },
                    layout: {
                        padding: 5,
                    },
                    elements: {
                        line: {
                            fill: false,
                            borderColor: this.graphColors.line.border.color,
                            borderWidth: 2,
                        },
                        point: {
                            backgroundColor: this.graphColors.line.fillColor,
                            radius: 3,
                            hitRadius: 30,
                            borderColor: this.graphColors.line.border.color,
                        },
                        rectangle: {
                            backgroundColor: this.graphColors.line.fillColor,
                            hoverBackgroundColor: this.graphColors.line.border.fillColor,
                        },
                    },
                    tooltips: {
                        // position: 'average',
                        enabled: false,
                        intersect: false,
                        mode: 'index',
                    },
                    scales: {
                        yAxes: [
                            {
                                id: 'barY',
                                type: 'linear',
                                position: 'right',
                                display: true,
                                ticks: {
                                    display: false,
                                    beginAtZero: true,
                                    fontColor: this.graphColors.scales.y_left.color,
                                    fontSize: 12,
                                    min: 0,
                                    mirror: false,
                                    maxRotation: 0,
                                    minRotation: 0,
                                },
                                gridLines: {
                                    display: true,
                                    drawBorder: false, //hide the chart edge line
                                    color: '#666D7C',
                                },
                                afterUpdate(scales)
                                {
                                    self.drawStaticScales(scales, scales.options.position);
                                },
//                                stacked: true,
                            },
                            {
                                id: 'lineY',
                                type: 'linear',
                                position: 'left',
                                display: false,
                                ticks: {
                                    display: false,
                                    beginAtZero: true,
                                    fontColor: this.graphColors.scales.y_left.color,
                                    fontSize: 12,
                                    min: 0,
                                    mirror: false,
                                    maxRotation: 0,
                                    minRotation: 0,
                                },
                                gridLines: {
                                    display: true,
                                    drawBorder: false, //hide the chart edge line
                                    color: '#666D7C',

                                },
                                afterUpdate(scales)
                                {
                                    self.drawStaticScales(scales, scales.options.position);
                                },
//                                stacked: true,

                            },
                        ],
                        xAxes: [
                            {
                                id: 'xAxe',
                                barThickness: 40,
                                type: 'category',
                                categoryPercentage: 0.00,
                                barPercentage: 0.00,
                                ticks: {
                                    display: false,
                                    fontColor: this.graphColors.scales.x.color,
                                    fontSize: 12,
                                    maxRotation: 0,
                                    minRotation: 0,
                                    autoSkip: false,
                                },
                                gridLines: {
                                    display: false,
                                    drawBorder: false, //hide the chart edge line

                                },
                                stacked: true,
                            },
                        ],
                    },
                    onClick: self.handleChartClick,
                };
            },
            /**
             *  1020 = windspeed (m/s)
             *  1012 = production (kWh)
             *  6001 = prognosis (kWh);
             *  currentdata {meta:{},stats:{}}
             */
            currentdata()
            {
                if (this.turbinedata['day'] != null) {

                    return this.turbinedata['day'].stats.find((value) => {
                        const start = Moment.utc(value.TimeFrom);
                        const end = Moment.utc(value.TimeThru);
                        const range = Moment.range(start, end);
                        return range.contains(Moment.utc());
                    });
                }
                return null;
            },
            windspeed()
            {
                let windspeed = '-';
                if (this.currentdata != null) {
                    windspeed = this.currentdata['1020'];

                    if (windspeed != null) {

                        if (typeof(windspeed) == 'number') {
                            windspeed = parseInt(windspeed);

                            if (isNaN(windspeed)) {
                                windspeed = '-';
                            }
                        }
                    }
                }
                return windspeed;
            },
            production()
            {
                let production = '-';
                if (this.currentdata != null) {
                    production = this.currentdata['1012'];

                    if (production != null) {

                        if (typeof(production) == 'number') {
                            production = parseInt(this.currentdata['1012']);

                            if (isNaN(production)) {
                                production = '-';
                            }
                        }
                    }
                }
                return production;
            },
            prognosis()
            {

                let prognosis = '-';
                if (this.currentdata != null) {
                    prognosis = this.currentdata['6001'];

                    if (prognosis != null) {

                        if (typeof(prognosis) == 'number') {
                            prognosis = parseInt(this.currentdata['6001']);
                            if (isNaN(prognosis)) {
                                prognosis = '-';
                            }
                        }
                    }
                }
                return prognosis;
            },

            selectedWindspeedObj()
            {
                if (this.selectedData && this.selectedData.windspeed) {
                    return this.selectedData.windspeed;

                }
                return false;
            },
            selectedWindspeed()
            {
                if (this.selectedWindspeedObj) {
                    if (typeof this.selectedWindspeedObj.value == 'string') {
                        return parseFloat(this.selectedWindspeedObj.value);
                    }
                    return this.selectedWindspeedObj.value;

                }
                return false;
            },
            selectedWindspeedUnit()
            {
                if (this.selectedWindspeedObj) {
                    return this.selectedWindspeedObj.unit;

                }
                return '';
            },
            selectedCurrencySymbol()
            {
                if (this.selectedEarningsObj) {
                    return this.selectedEarningsObj.unit;
                }
            },

            selectedEarningsObj()
            {
                if (this.selectedData && this.selectedData.earnings) {
                    return this.selectedData.earnings;

                }
                return false;
            },
            selectedEarnings()
            {
                if (this.selectedEarningsObj) {
                    if (typeof this.selectedEarningsObj.value == 'string') {
                        return parseInt(this.selectedEarningsObj.value);
                    }
                    return this.selectedEarningsObj.value;

                }
                return false;
            },
            mutatedSelectedMoneyUnit()
            {
                if (this.selectedEarnings) {
                    let mutated = this.mutatedSelectedMoneyObj;
                    return '(x ' + mutated.unit + ')';
                }

                return '';
            },
            mutatedSelectedMoneyObj()
            {
                if (this.selectedEarnings) {
                    return this.mutateMoney(this.selectedEarnings);

                }

                return false;
            },
            mutatedSelectedMoney()
            {
                if (this.mutatedSelectedMoneyObj) {
                    return this.mutatedSelectedMoneyObj.value;
                }

                return false;
            },
            mutatedSelectedProductionObj()
            {
                if (this.selectedProductionObj) {
                    return this.mutateProduction(this.selectedProductionObj.value);
                }

                return false;

            },

            selectedProductionObj()
            {
                if (this.selectedData && this.selectedData.production) {
                    return this.selectedData.production;

                }
                return false;
            },
            selectedProduction()
            {
                if (this.mutatedSelectedProductionObj) {
                    if (typeof this.mutatedSelectedProductionObj.production == 'string') {
                        return parseInt(this.mutatedSelectedProductionObj.production);
                    }
                    return this.mutatedSelectedProductionObj.production;

                }
                return false;
            },
            selectedProductionUnit()
            {
                if (this.mutatedSelectedProductionObj) {

                    return this.getTranslation(this.mutatedSelectedProductionObj.unit);

                }
                return '';
            },
            carddescription()
            {
                return this.getTranslation('Overviewturbine');

            },
            intervalOptions()
            {

                let options = [
                    {
                        id: 'day',
                        value: this.getTranslation('Statistics12'),
                        show: this.showDay,
                    },
                    {
                        id: 'month',
                        value: this.getTranslation('Statistics13'),
                        show: this.showMonth,
                    },
                    {
                        id: 'year',
                        value: this.getTranslation('Statistics15'),
                        show: this.showYear,
                    },
                    {
                        id: 'total',
                        value: this.getTranslation('Statistics17'),
                        show: this.showTotal,
                    },
                ];

                return options;
            },

        },
        methods: {
            initChart()
            {
                setTimeout(() => {
                    this.setActiveTab(this.initialTab);
                }, 1500);

                this.setDataInterval();

            },
            setDataInterval()
            {

                let self = this;
                this.clearDataInterval();//clear first if exists
                this.refresh = setInterval(function () {

                    self.setActiveTab(self.activeTab);

                }, 5 * (60 * 1000));//every 5 min data refresh?
            },
            setActiveTab(e)
            {
                let selection = e.selection ? e.selection : e;

                if (selection !== this.activeTab || this.turbinedata[selection] == null) {
                    //get different data.
                    this.activeTab = selection || 'day';

                    //reset data above graph
                    this.selectedData = false;

                    //get fresh data.
                    this.getStatsData()
                        .then((data) => {

                            this.loadGraph(data);
                        })
                        .catch((err) => {
                            this.alert(err);
                            return false;
                        });
                }
            },
            /**
             * return promise
             */
            getStatsData(forceRefresh)
            {

                if (forceRefresh || this.turbinedata[this.activeTab] == null) {
                    //fetch data based on turbineId and interval (day,month,year or total)
                    //returns promise to be resolved.
                    return Windmill.getTurbineChartDataById(this.turbineId, this.activeTab)
                        .then((result) => {
                            if (result.status == 200) {
                                this.turbinedata[this.activeTab] = {
                                    stats: result.data.ChartData,
                                    meta: result.data.MetaData,
                                    settings: result.data.Settings,
                                };

                                return this.turbinedata[self.activeTab];
                            }
                            return false;
                        })
                        .catch((err) => {
                            console.error("error fetching turbineChartDataByID for ", this.turbineId, err);
                            return false;
                        });

                } else {
                    return new Promise((resolve, reject) => {
                        return resolve(this.turbinedata[this.activeTab]);
                    });
                }
            },

            /**
             * @param {Object} data {stats,meta}
             */
            loadGraph(data)
            {
                let self = this;
                if (!data) {
                    if (this.turbinedata[this.activeTab] == null) {
                        return false;
                    } else {
                        data = this.turbinedata[this.activeTab];
                    }
                }

                let labels = this.generateLabels(data.stats);
                let datasets = this.generateDataSets(data.meta, data.stats, data.settings);
                this.generateHTMLGridData(this.labelObjs);

                this.graphdata = {
                    type: 'bar',//overall type, must be bar to be able to put in line and bar chart.
                    labels: labels,
                    datasets: datasets,
                };

                setTimeout(() => {
                    if (self.$refs.statsgraph) {

                        if (this.hasPrognose) {
                            Chart.helpers.each(self.$refs.statsgraph._chart.getDatasetMeta(1).data, function (rectangle, index) {
                                rectangle.draw = function () {
                                    self.$refs.statsgraph._chart.chart.ctx.setLineDash([5, 5]);
                                    Chart.elements.Rectangle.prototype.draw.apply(this, arguments);
                                };
                            }, null);
                        }

                        self.$refs.statsgraph.resizeWidth(self.spacing);
                        let legend = self.$refs.statsgraph.getLegend();
                        $('.graphLegendHolder').html(legend);

                        $("#statsgraph").click();
                    }
                }, 750);

            },

            generateDataSets(meta, data, settings)
            {

                let datasets = [];
                let set = {};

                for (let i in meta) {

                    set.type = this.graphTypes[meta[i].GenericDataTypeID];
                    set.dataTypeId = meta[i].GenericDataTypeID;
                    set.label = meta[i].GenericDataTypeDisplayName;
                    set.dataLabel = meta[i].GenericDataTypeDisplayName;
                    set.dataUnit = meta[i].Unit;
                    set.dataMeta = meta[i];
                    set.yAxisID = set.type + 'Y';

                    let graphColorOpts = this.graphColors.line;

                    if (set.type == 'line') {
                        set.lineTension = 0;
                        set.showLine = false;
                    } else {

                        if (set.dataTypeId == 1012) {
                            //production
                            graphColorOpts = this.graphColors.bar;
                        }
                        if (set.dataTypeId == 6001) {
                            //prognose
                            graphColorOpts = graphColorOpts = this.graphColors.bar2;

                        }

                        //set border
                        set.borderWidth = graphColorOpts.border.width;
                        set.borderColor = graphColorOpts.border.color;
                        set.borderDash = [10, 5];

                        set.hoverBackgroundColor = graphColorOpts.selected.fillColor;
                        set.hoverBorderColor = graphColorOpts.selected.borderColor;

                        if (settings[0].AppInitialBarCount) {
                            set.barThickness = (window.innerWidth * 0.9) / settings[0].AppInitialBarCount;
                        } else {
                            set.barThickness = 40;
                        }

                    }

                    set.backgroundColor = graphColorOpts.fillColor;
                    set.borderColor = graphColorOpts.border.color;

                    let spacing = ((window.innerWidth * 0.75) - 32.5) / settings[0].AppInitialBarCount;
                    this.graphoptions.scales.xAxes[0].barThickness = spacing - 12;
                    this.spacing = spacing;

                    set.data = [];
                    //generate data
                    for (let d in data) {
                        let val = (data[d][set.dataTypeId] <= 0) ? 0 : parseFloat(data[d][set.dataTypeId]).toFixed(meta[i].Decimals);
                        if (set.dataTypeId == 1020 && data[d][set.dataTypeId] == null) {
                            val = -1;
                        }
                        set.data.push(val);
                    }

                    datasets.push(set);
                    //reset
                    set = {};
                }

                let production = datasets.find((val) => {
                    return val.dataTypeId === 1012;
                });
                let prognose = datasets.find((val) => {
                    return val.dataTypeId === 6001;
                });
                let windspeed = datasets.find((val) => {
                    return val.dataTypeId === 1020;
                });

                this.hasPrognose = false;
                if (prognose) {
                    this.hasPrognose = true;
                    return [windspeed, prognose, production];
                }
                return [windspeed, production];

            },
            generateLabels(stats)
            {
                if (!stats) {
                    return [];
                }
                let labels = [];
                let label = '';
                this.labelObjs = [];
                //depending on the scale/interval we have to set different
                for (let c in stats) {
                    label += stats[c].LocalDateLabel;
                    //simple date label
                    labels.push(label);

                    //save the object to be used in html grid
                    /* 1020 = windspeed (m/s)
                    *  1012 = production (kWh)
                    *  6001 = prognosis (kWh);
                    */
                    let obj = {
                        production: stats[c][1012],
                        prognosis: stats[c][6001],
                        windspeed: stats[c][1020],
                        localDate: stats[c].LocalDate,
                        localDateLabel: stats[c].LocalDateLabel,
                        UTCDate: stats[c].UTCDate,
                        UTCDateLabel: stats[c].UTCDateLabel,
                    };

                    this.labelObjs.push(obj);
                    label = '';
                }
                label = null;
                return labels;
            },
            /**
             * draw static scales on different canvas, outside the main canvas
             * @param scales
             * @param leftOrRight
             * @returns {boolean}
             */
            drawStaticScales(scales, leftOrRight)
            {
                if (!scales) {
                    return false;
                }

                let scalesList = document.getElementById("scalesHolderLeft");

                if (leftOrRight === 'right') {
                    scalesList = document.getElementById("scalesHolderRight");
                }

                let copyWidth = scales.width;
                let copyHeight = scales.height + 10;

                $(scalesList).height(copyHeight + 35);

                let itemDistance = (copyHeight / scales.ticks.length) - 7;

                let items = '<ul class="staticScales scalesY ' + leftOrRight + '" style="height: ' + copyHeight + 'px;" height="' + copyHeight + '" width="' + copyWidth + '">';
                for (let t in scales.ticks) {

                    if (t == scales.ticks.length - 1) {
                        itemDistance = 0;//last one no margin-bottom
                    }
                    items += '<li class="scaleItem" style="">' + scales.ticks[t] + '</li>';

                }

                //set as html.
                $(scalesList).html(items);
                // SCROLL TO RIGHT TO VIEW MOST RECENT DATA
                let el = document.querySelector('.graphWrapper');
                el.scrollLeft = 9999;

                //todo also select last item to show data; -- not possible right now
            },
            handleChartClick(evt, chartElArray)
            {
                let chart = this.$refs.statsgraph;
                let dataAtClickEvent = chart.getDataObjOfElementAtEvent(evt);
                if (dataAtClickEvent && dataAtClickEvent.length) {
                    let production = dataAtClickEvent.find((val) => {
                        return val.meta.GenericDataTypeID == 1012;
                    });

                    let earnings = this.calculateEarnings(production.value, this.kwhPrice);

                    let windspeed = dataAtClickEvent.find((val) => {
                        return val.meta.GenericDataTypeID == 1020;
                    });

                    let prognose = dataAtClickEvent.find((val) => {
                        return val.meta.GenericDataTypeID == 6001;
                    });

                    if (windspeed.value < 0) {
                        windspeed.value = 0;
                    }

                    this.selectedData = {
                        windspeed: windspeed,
                        production: production,
                        earnings: {
                            value: Math.round(earnings),
                            unit: this.convertCurrencyCodeToSign(this.currencyCode),
                        },
                        prognose: prognose || {value: -1, unit: 'kWh'},
                    };
                }
            },
            generateHTMLGridData(labelObjs)
            {
                let griddata = [];
                let set = {};
                if (labelObjs) {
                    let locale = this.$store.getters['user/getUserProperty']('CultureCode');
                    let top, bottom, date;
                    for (let i in labelObjs) {

                        set.time = {};
                        date = new Date(labelObjs[i].localDate);
                        Moment.locale(locale);
                        //check the interval and change the diplayed date (either day or month or time with year or month
                        switch (this.activeTab) {
                            case 'day':
                                let split = labelObjs[i].localDateLabel.split(' ');
                                top = split[0];//day
                                bottom = split[1];
                                break;
                            case'month':
                                top = Moment(date).format('D-M');
                                bottom = date.getFullYear();
                                break;
                            case 'year':
                                top = date.toLocaleString(locale, {month: "short"});
                                bottom = date.getFullYear();
                                break;
                            case 'total':
                                top = '';
                                bottom = labelObjs[i].localDateLabel;
                                break;
                            default:
                                top = '--';
                                bottom = '--';
                                break;

                        }

                        set.time.top = top;
                        set.time.bottom = bottom;

                        bottom = top = null;
                        set = {...set, ...labelObjs[i]};
                        griddata.push(set);
                        set = {};
                    }

                    this.htmlGridData = griddata;
                }
            },
            resizeGridHolder(data)
            {
                $('.gridholder').width(data.width);
            },
            calculateEarnings(productionInKwh, kwhPrice = this.kwhPrice)
            {
                if (typeof productionInKwh == 'string') {
                    productionInKwh = parseInt(productionInKwh);
                }
                return productionInKwh * kwhPrice;
            },
            clearDataInterval()
            {

                if(this.refresh){
                    clearInterval(this.refresh);
                }
                this.refresh = null;
            }
        },

        components: {
            statsgraph: StatsGraph,
            CountUpNumber,
            DropdownWithModal,
            SelectWithModal,
        }
        ,
    }
    ;
</script>
