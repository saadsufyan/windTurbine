<template>
    <div class="park-overview anim-container scroll-container hasTabBar">
        <overview-card :carddescription="overviewcardDescription"
                       :overviewdata="overviewCardData" v-if="!singleWindmill">
        </overview-card>
        <div class="windmills-container">
            <singleWindmill v-for="(value, key) in computedWindmills" v-bind:key="value.ID" :data="value"
                            class="singleWindmill" :isPark="false"/>
        </div>
    </div>
</template>

<script>
    import {mapGetters} from 'vuex';
    import windmillClass from '../windmill/windmill.js';
    import hexagon from '../hexagon/hexagon.vue';
    import windmill from '../windmill/windmill.vue';
    import singleWindmill from '../windmill/windmill_card.vue';
    import OverviewCard from '../overview-card/overview-card.vue';

    export default {
        name: "OverviewTurbine",
        data()
        {
            return {
                output: 0,
                speed: 0,
                windmills: [],
                park: false,
                id: '',
                query: '',
                refresh: null,
                refreshTime: 30000,
                overviewCardData: {},

            };
        },
        mounted()
        {
            this.id = this.$route.params.id;

            this.$store.commit('navbar/showLoading', true);

            setTimeout(() => {
                this.initialize();
            }, 1050);

            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        computed: {
            ...mapGetters('windmills', ['getParkById', 'getParks']),
            computedWindmills()
            {
                let self = this;
                if (this.windmills && this.windmills.length > 0) {
                    this.windmills = _.orderBy(this.windmills, ['DisplayName'], ['ASC']);
                    return this.windmills.filter(function (item) {

                        if (self.$store.state.windmills.showWarnings) {
                            return item.Status != 1;
                        } else {
                            return item.DisplayName.toLowerCase().indexOf(self.query.toLowerCase()) !== -1;
                        }

                    });
                }
            },
            totalWindmills()
            {
                return this.windmills.length;
            },
            singleWindmill()
            {
                return (this.windmills.length == 1);
            },
            prognoseInfo()
            {
                return this.getTranslation('Prognoseinfotext');
            },
            overviewcardDescription()
            {
                if (this.park && this.park.DisplayName) {
                    return this.getTranslation('Overview') + ' ' + this.park.DisplayName;
                }
                return this.getTranslation('Overviewpark') || '';
            },

        },
        beforeDestroy()
        {
            this.clearDataInterval();
            //if this component is destroyed, we remove the eventlisteners
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        methods: {
            initialize()
            {
                // Initially load all turbines (also fire this method when pull-to-refresh is fired so all turbines are loaded properly)
                this.setData(true);
                this.setDataInterval();
                this.$store.commit('windmills/setCurrentPark', this.id);
                this.$store.state.windmills.showWarnings = false;
            },
            setDataInterval()
            {

                let $this = this;
                this.clearDataInterval();//clear first before setting (if set)
                this.refresh = setInterval(function () {

                    $this.setData(true);
                }, $this.refreshTime);
            },

            setData(refresh)
            {
                //getParkId with refresh = true, we will refresh the data and get the new realtime data of the park(turbines)
                windmillClass.getParkById(this.id, refresh)
                    .then((data) => {
                        /*
                         *  if park is not found in localStorage, or refresh is true, we get newly fetched data object containing
                        *   {
                        *   turbines
                        *   }
                        * */

                        this.park = data;
                        this.windmills = data.Turbines;
                        this.generateOverviewCardData(data);
                        this.$store.commit('navbar/showLoading', false);
                    })
                    .catch((error) => {
                        console.error(error);
                        return;
                    });
            },
            /**
             * generate data for overview card.
             * @param parkData
             */
            generateOverviewCardData(parkData)
            {
                let currentProd = this.mutateProduction(parkData.RealTimeProduction, true);

                if (parkData) {
                    this.overviewCardData = {
                        rawdata: parkData,
                        currentWindspeed: parkData.Windspeed,
                        currentProduction: currentProd.production,
                        currentProductionUnit: this.getTranslation(currentProd.unit),
                        totalParkCount: 0,
                        totalTurbineCount: parkData.Turbines.length,
                        isPark: true,
                        isTotal: false,
                        ID: parkData.ID,
                        total: parkData.total,
                    };
                }
            },

            openAllWinparksMap()
            {
                this.$router.push({name: 'overviewmap'});
            },
            clearDataInterval()
            {
                if (this.refresh) {
                    clearInterval(this.refresh);
                }
                this.refresh = null;
            }
        },
        components: {
            windmill: windmill,
            hexagon: hexagon,
            singleWindmill: singleWindmill,
            overviewCard: OverviewCard,
        },
    };
</script>
