<template>
    <div class="overview scroll-container">
        <overview-card :carddescription="overviewcardDescription"
                       :overviewdata="overviewCardData" :actionbuttontext="actionbuttontext"
                       @onActionbutton="openAllWinparksMap">
        </overview-card>

        <transition-group
                name="fade"
                tag="div"
                class="windmills-container row">
            <singleWindmill v-for="(value, key) in computedList" v-bind:key="key" v-bind:data="value"
                            v-bind:error-status="errorStatus" :isPark="true"/>
        </transition-group>
    </div>
</template>

<script>
    import {mapGetters} from 'vuex';
    import windmillClass from '../windmill/windmill.js';
    import VuePullRefresh from 'vue-pull-refresh';
    import searchBar from '../../components/search/search.vue';
    import hexagon from '../hexagon/hexagon.vue';
    import windmill from '../windmill/windmill.vue';
    import singleWindmill from '../windmill/windmill_card.vue';
    import OverviewCard from '../overview-card/overview-card.vue';

    export default {
        name: 'Overview',
        mounted()
        {
            this.$store.commit('navbar/setSearchType', 'parks');
            this.$store.commit('navbar/setSearchId', null);
            this.$store.commit('navbar/showLoading', true);
            this.$store.commit('windmills/setCurrentPark', null);

            setTimeout(() => {
                this.initialize(true);
            }, 1000);

            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);

        },
        beforeDestroy()
        {
            this.clearDataInterval();
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);

        },
        data: function () {
            return {
                output: 0,
                speed: 0,
                query: '',
                windmills: [],
                isPark: false,
                errorStatus: '',
                translationStrings: {},
                refresh: null,
                refreshTime: 30000,
                overviewCardData: {},
            };
        },
        computed: {
            computedList()
            {
                let self = this;
                if (this.windmills && this.windmills.length > 0) {
                    this.windmills = _.orderBy(this.windmills, ['DisplayName'], ['ASC']);
                    return this.windmills.filter(function (item) {
                        return item.DisplayName.toLowerCase().indexOf(self.query.toLowerCase()) !== -1;
                    });
                }
            },
            totalWindmills()
            {
                return this.windmills.length || 0;
            },
            singlePark()
            {
                return (this.windmills.length == 1);
            },
            showSearch()
            {
                return (this.windmills.length >= 6);
            },
            overviewcardDescription()
            {
                return this.getTranslation('Overviewtotal') || '';
            },
            actionbuttontext()
            {
                return this.getTranslation('Map') + ' ' + this.getTranslation('All') + ' ' + this.getTranslation("Windparks");
            },

        },

        methods: {
            search(value)
            {
                this.query = value;
            },
            setDataInterval()
            {
                //clear before setting new one (if existing)
                this.clearDataInterval();

                let $this = this;
                this.refresh = setInterval(function () {
                    $this.setData(true);

                }, $this.refreshTime);
            },
            initialize(refresh)
            {

                // Check to see if the view is loaded when in fact it should already load a more detailed view;
                // This is checked by the "HomePath". HomePath is based on how many parks and/or turbines the user has
                // NOTE:: this should already work when coming in through the login (this is also a browser refresh fix)
                if (this.getHomePath() != 'overview') {
                    this.$router.replace({path: this.getHomeLink()});
                    return;
                }

                this.$store.commit('navbar/showNavBar', true);
                this.$store.commit('navbar/changeWindowTitle', this.getTranslation("Parks"));

                // SET INTERVAL FOR REFRESHING DATA
                this.setDataInterval();

                // Fetch TurbineStatus enumeration
                if (refresh) {
                    // this.getTurbineStatusEnumeration();
                    windmillClass.getAssets();
                    this.setData(true);
                }
            },
            getTurbineStatusEnumeration()
            {
                let self = this;
                if (localStorage.turbineStatus) {
                    self.errorStatus = true;
                } else {
                    windmillClass.getEnumeration('AppTurbineStatusCompactList')
                        .then((data) => {
                            if (data.AppTurbineStatusCompactList) {
                                self.errorStatus = true;
                                localStorage.turbineStatus = JSON.stringify(data.AppTurbineStatusCompactList);
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            },

            setData(refresh)
            {
                let parks = this.$store.getters['windmills/getParks'];
                if ((!parks.parks || !parks.parks.length) || refresh === true) {
                    // Fetch all parks
                    windmillClass.initialiseData()
                        .then((data) => {

                            // When this promise is resolved, the data should be available through the store, getParks will return a mutated object
                            let parks = this.$store.getters['windmills/getParks'];
                            let turbines = this.$store.getters['windmills/getTurbines'];

                            this.windmills = windmillClass.mutateParkObject(parks.parks, turbines, parks.parkTurbines);
                            // Set "total" variables

                            this.generateOverviewCardData(this.windmills);

                            setTimeout(() => {
                                this.$store.commit('navbar/showLoading', false);
                            }, 500);
                        })
                        .catch((error) => {
                            console.error(error);
                            this.$store.commit('navbar/showLoading', false);
                        });
                } else {

                    this.windmills = windmillClass.mutateParkObject(parks.parks, parks.turbines, parks.parkTurbines);
                    // Set "total" variables
                    this.generateOverviewCardData(this.windmills);
                }
            },

            /**
             * show the totals for the user's Turbines
             */
            async generateOverviewCardData(parkData)
            {
                try {
                    //fetch data
                    let {data} = await windmillClass.getUserTotalsThisMonth();

                    if (data.PrognosisData.length) {
                        let userPrognosis = data.PrognosisData[0];

                        let currentProd = this.mutateProduction(parkData.total.RealTimeProduction, true);
                        let currentProdUnit = this.getTranslation(currentProd.unit);

                        this.overviewCardData = {
                            rawdata: {...parkData, userPrognosis: userPrognosis},
                            currentWindspeed: parkData.average.Windspeed,
                            currentProduction: currentProd.production,
                            currentProductionUnit: currentProdUnit,
                            totalParkCount: parkData.totalParkCount,
                            totalTurbineCount: parkData.totalTurbineCount,
                            isPark: false,
                            isTotal: true,
                            ID: -1,
                            total: parkData.total,
                        };

                    }

                    // //only change if it goes all well
                }
                catch (e) {
                    console.error('error generating total overview data ', e);
                    throw e;
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
            searchBar,
            windmill,
            hexagon,
            singleWindmill,
            VuePullRefresh,
            OverviewCard,
        },
    };
</script>
