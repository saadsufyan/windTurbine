<template>
    <div class="turbine-with-chart">
        <!--<donut-chart :chart-data="_chartData" :options="_chartOptions" class="doughnut-chart"></donut-chart>-->
        <!--<div class="donut-chart-holder">-->
            <!--<div class="donut-chart chart1">-->
                <!--<div class="slice one"></div>-->
                <!--<div class="slice two"></div>-->
                <!--<div class="chart-center">-->
                    <!--&lt;!&ndash;<span></span>&ndash;&gt;-->
                <!--</div>-->
            <!--</div>-->
        <!--</div>-->
        <div class="donut-chart-holder" :class="size == 2 ? 'large' : 'small'">
            <svg v-if="showSvg" :width="svgWidth" :height="svgHeight" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <circle :id="computedId" :stroke-dashoffset="prognosisPercentage" class="circle_animation" :r="svgRadius" :cy="svgY" :cx="svgX" stroke-width="2" stroke="#6fdb6f" fill="none"/>
                </g>
            </svg>
        </div>
        <!--<div class="turbine" :class="turbineType"></div>-->
        <div class="windmill-holder">
            <windmill :class="[turbineType,turbineSpeed]"/>
        </div>
    </div>
</template>
<script>

    import DonutChart from './doughnut-vuechartjs.vue';
    import Windmill from '../windmill/windmill.vue';

    export default {
        name: 'turbine-chart',
        props: {
            prognosisData: {
                required: false,
                type: Object,
            },
            chartData: {
                required: true,
                type: Object,

            },
            chartOptions: {
                required: false,
                type: Object,
            },
            turbineData: {
                required: true,
                type: Object,
            },
            size: {
                required: false,
            }
        },
        components: { DonutChart, Windmill },
        data() {
            return {
                svgSize: {
                    // Small turbine with chart
                    1: {
                        svgWidth: 50,
                        svgHeight: 50,
                        svgRadius: 24,
                        svgX: 25,
                        svgY: 25,
                    },
                    // Large turbine with chart
                    2: {
                        svgWidth: 125,
                        svgHeight: 125,
                        svgRadius: 61.5,
                        svgX: 62.5,
                        svgY: 62.5,
                    }
                },
                showSvg: false,
                svgWidth: null,
                svgHeight: null,
                svgRadius: null,
                svgX: null,
                svgY: null,
                statusColors: {
                    'unknown': '#fff',
                    'positive': '#3ACA60',
                    'normal': '#8A42AE',//normal
                    'error': '#FF688B',//error
                    'warning': '#FFD368'  //no connection
                },
                id: null,
                circlePercentage: 0,
                defaultChartData: {

                },
                defaultChartOptions: {
                    // Options for chartjs
                    // Makes sure the chart isn't huge.
                    maintainAspectRatio: false,
                    // Makes the chart a little slimmer
                    cutoutPercentage: 95,
                    // Changes the position we start from
                    rotation: -90 * Math.PI / 180,//to actually start at 12 o'clock
                    // Disable the legend
                    legend: {
                        display: false,
                    },
                    // Disable tooltips
                    tooltips: {
                        enabled: false,
                    },
                },
            };
        },
        mounted() {
            this.setPrognosisSize(this.size);
        },
        methods: {
            setPrognosisSize(size) {
                this.svgWidth = this.svgSize[size].svgWidth;
                this.svgHeight = this.svgSize[size].svgHeight;
                this.svgRadius = this.svgSize[size].svgRadius;
                this.svgY = this.svgSize[size].svgY;
                this.svgX = this.svgSize[size].svgX;
                this.showSvg = true;
            }
        },
        computed: {
            turbineType() {
                //the type of turbine we want to display
                return this.turbineData.type || '';
            },
            turbineSpeed() {
                let speed = 0;

                if (this.turbineData.rawdata) {
                    let rawdata = this.turbineData.rawdata;
                    if (rawdata.Connection == 0 || rawdata.TurbineStatusId == 0) {
                        return 'speed-0';
                    }
                }

                if (this.turbineData.speed > 0 && this.turbineData.speed <= 5) {
                    speed = 20;
                } else if (this.turbineData.speed > 5 && this.turbineData.speed <= 10) {
                    speed = 40;
                } else if (this.turbineData.speed > 10 && this.turbineData.speed <= 15) {
                    speed = 60;
                } else if (this.turbineData.speed > 15 && this.turbineData.speed <= 20) {
                    speed = 80;
                } else if (this.turbineData.speed > 25 && this.turbineData.speed <= 30) {
                    speed = 100;
                }

                return 'speed-' + speed;
            },
            computedId() {
                return 'chart-'+ this.id;
            },
            prognosisPercentage() {
                if (this.prognosisData) {
                    if (this.prognosisData.size) {
                        this.setPrognosisSize(this.prognosisData.size);
                    }
                    this.id = this.prognosisData.id;

                    let percentage = this.prognosisData.prognosis;
                    // 100% = this.prognosisData.prognosis;
                    // X% = this.prognosisData.production


                    // Max = 150 | Min = 0
                    setTimeout(() => {
                        let element = document.getElementById(this.computedId);

                        if (percentage >= 100) {
                            percentage = 100;
                        }

                        let color = this.statusColors['normal'];

                        if (percentage <= 25) {
                            color = this.statusColors['error'];
                        } else if (percentage < 50 && percentage > 25) {
                            color = this.statusColors['warning'];
                        } else if (percentage < 75 && percentage >= 50) {
                            color = this.statusColors['normal'];
                        } else {
                            color = this.statusColors['positive'];
                        }

                        let factor;
                        if (this.size == 1) {
                            factor = 150;
                        } else if (this.size == 2) {
                            factor = 385;
                        }

                        percentage = factor - (percentage * (factor / 100));

                        element.style.stroke = color;
                        element.style.strokeDashoffset = percentage;
                    }, 250);
                } else {
                    return 0;
                }
            },
            _chartData() {
                if (this.chartData) {
                    return { ...this.defaultChartData, ...this.chartData };
                }
                return this.defaultChartData
            },
            _chartOptions() {
                if (this.chartOptions) {
                    return { ...this.defaultChartOptions, ...this.chartOptions };
                }
                return this.defaultChartOptions;
            },

        },
    }
</script>