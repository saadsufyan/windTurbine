<script>
    /**
     * Created by lennaerd on 03-04-17.
     *
     * chart using vue-chartjs, a vuejs wrapper for chart.js (http://www.chartjs.org/docs/)
     */
    import { Bar, Line, mixins } from 'vue-chartjs';
    import store from '../../store';

    const { reactiveProp } = mixins;

    export default {
        extends: Bar,
        name: 'statsgraph',
        props: ['options', 'spacing'],
        mixins: [reactiveProp],
        mounted() {
            this.renderChart(this.chartData, this.options);

        },
        watch: {
            chartData: function(newValue) {
                if(this._chart){
                    this._chart.destroy();
                    this.renderChart(newValue, this.options);
                }
                this.resizeWidth(this.spacing);
            }
        },
        methods: {
            /**
             * method to get and join the data object of the ie clicked element
             * if that index holds 3 types of data (ie. windspeed,production,earnings) we will return this as follows:
             * {
             *  windspeed: <value>
             *  production : <value>
             *  earnings: <value>
             *
             *  }
             * @param evt
             */
            getDataObjOfElementAtEvent(evt) {
                let datasets = this.getDataSets();
                //first get the chart
                //get the datasets of the evt.target
                let elements = this.getElementsAtEvent(evt);//returns array with chart elements in event
                let dataObj = [];

                //need to find the value + label of the elements at the event
                if (elements) {
                    for (let el of elements) {
                        let datasetIdx = el._datasetIndex;
                        let idxInDataset = el._index;
                        let meta = this.getDataSetMetaByIndex(datasetIdx);
                        let elDataset = datasets[datasetIdx];
                        let value = elDataset.data[idxInDataset];
                        let key = elDataset.dataLabel;

                        dataObj.push(
                            {
                                label: key,
                                value: value,
                                unit: elDataset.dataUnit,
                                meta: elDataset.dataMeta,
                            },
                        );
                    }
                }

                return dataObj;

            },
            getElementsAtEvent(evt) {
                let chart = this.getChart();
                let items = chart.getElementsAtEvent(evt);

                if (items && items.length) {
                    return items;
                }

                return false;

            },
            getDataSetAtEvent(evt) {
                return this.getChart().getDatasetAtEvent(evt);
            },
            getDataSetMetaByIndex(idx) {
                return this.getChart().getDatasetMeta(idx);
            },
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
            getChart() {
                return this._chart;
            },
            resizeWidth(totalSpacer = 50) {
                let datasets = this.getDataSets();
                let newWidth = 0;
                let parent = $(this.getParent());

                if (datasets.length > 0) {
                    let datasets = this.getDataSets();

                    if (datasets.length > 0) {
                        datasets = datasets[0];

                        if (datasets.data && datasets.data.length) {
                            newWidth = datasets.data.length * totalSpacer;
                        }
                    }
                }
                let parentsParentWidth = parent.parent().width();

                if (newWidth < parentsParentWidth) {
                    newWidth = parentsParentWidth;
                }

                parent.width(newWidth);

                this._chart.resize();

                this.$emit('resizedGraphWidth', { width: newWidth });

            },
            focusLastElement() {
                let e = new $.Event('click');
                e.pageX = 326;
                e.pageY = 552;
                $(this.getCanvas()).trigger(e);
            },
        },
    };
</script>