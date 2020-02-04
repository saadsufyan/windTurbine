<template>
    <div class="anim-container overview warning">
        <div class="windmills-container row">
            <singleWindmill v-for="(value, key) in windmills" v-bind:key="key" v-bind:data="value"
                            class="col-100 singleWindmill errorWindmill"/>
        </div>
    </div>
</template>

<script>
    import singleWindmill from '../windmill/windmill_card.vue';

    export default {
        data()
        {
            return {
                windmills: [],
                refreshTime: 30000,
                refresh: null,
            };
        },
        mounted()
        {
            this.init();
            this.$store.commit('navbar/setSearchType', 'warning');
            this.$store.commit('navbar/setSearchId', null);
            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        beforeDestroy()
        {
            this.clearDataInterval();
            //if this component is destroyed, we remove the eventlisteners
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        methods: {
            init()
            {
                this.$store.commit('navbar/showNavBar', true);
                this.$store.commit('navbar/changeWindowTitle', this.getTranslation('Alerts'));

                this.setData(true);
                this.setDataInterval();
            },
            setDataInterval()
            {
                let $this = this;

                //clear before setting a new one if exists
                this.clearDataInterval();

                this.refresh = setInterval(function () {
                    $this.setData(true);
                }, $this.refreshTime);
            },
            setData(refresh)
            {
                this.windmills = this.$store.getters['windmills/getWarningTurbines'];

                if (this.windmills.length == undefined || refresh == true) {
                    // Fetch all parks
                    windmillClass.initialiseData()
                        .then((data) => {
                            // When this promise is resolved, the data should be available through the store, getParks will return a mutated object
                            this.windmills = this.$store.getters['windmills/getWarningTurbines'];
                        })
                        .catch((error) => {
                            console.error(error);
                            this.alert(error);
                        });
                }
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
            singleWindmill: singleWindmill,
        }
    };
</script>
