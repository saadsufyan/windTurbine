<script>
    /**
     * Created by lennaerd on 03-04-17.
     *
     * chart using vue-chartjs, a vuejs wrapper for chart.js (http://www.chartjs.org/docs/)
     */

    import { Bar, Line, mixins } from 'vue-chartjs';

    const { reactiveProp } = mixins;

    export default {
        extends: Bar,
        name: 'statsgraph',
        props: ['options', 'height'],
        mixins: [reactiveProp],
        mounted() {
            this.renderChart(this.chartData, this.options);
        },
        watch: {
            chartData(newValue) {
                //updated?
                this.resizeWidth();
            },
        },
        methods: {
            getLegend() {
                return this._chart.generateLegend();
            },
            getScales() {
                return this._chart.scales;
            },
            getCtx() {
                return this._chart.chart.ctx;
            },
            getCanvas() {
                return this._chart.chart.canvas;
            },
            getParent() {
                return this._chart.chart.canvas.parentElement;
            },
            getDataSets() {

                return this.chartData.datasets || [];
            },
            resizeWidth() {
                let datasets = this.getDataSets();
                let newWidth = 0;

                if (datasets.length > 0) {
                    let datasets = this.getDataSets();

                    if (datasets.length > 0) {
                        datasets = datasets[0];

                        if (datasets.data && datasets.data.length) {
                            newWidth = datasets.data.length * 60;
                        }
                    }
                }
                let parentsParentWidth = $(this.getParent()).parent().width();
                if (newWidth < parentsParentWidth) {
                    newWidth = parentsParentWidth;
                }

                $(this.getParent()).width(newWidth);

                this._chart.resize();
                this.$emit('resizedGraphWidth', { width: newWidth });

            },
        },
    }
</script>