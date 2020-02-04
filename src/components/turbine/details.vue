<template>
    <div class="anim-container hasTabBar turbine-details">
        <overview-card :infotext="prognoseInfo" :carddescription="overviewcardDescription"
                       :overviewdata="overviewCardData">
        </overview-card>

        <div class="card">
            <div class="maps-info-card-title">
                <div class="status-code">
                    {{ getTranslation("Statuscode") }}: {{ turbine.StatusCode }} <span
                        v-if="turbine.StatusCodeDescription">-</span> {{ turbine.StatusCodeDescription }}
                </div>
                <div class="status-holder">
                    <span class="status-icon status-bulb" :class="statusClass"></span><span>{{status}}</span>
                </div>
            </div>
            <div class="maps-holder">
                <div id="gmaps" style="height:100%; width:100%;"></div>
            </div>
            <div class="information">
                <ul>
                    <!--<li class="clearfix" v-if="statusDescription"><span class="status">{{ statusDescription }}</span>-->
                    <!--</li>-->
                    <li class="clearfix"><span class="label">{{ getTranslation('Brand') }}</span> <span class="status">{{ brand }}</span>
                    </li>
                    <li class="clearfix"><span class="label">{{ getTranslation('Total') }} {{ getTranslation('Production') }}</span>
                        <span class="status">{{ totalProduction }}</span></li>
                    <li class="clearfix"><span class="label">{{ getTranslation('Power') }}</span> <span class="status">{{ power }}</span>
                    </li>
                    <li class="clearfix"><span class="label">{{ getTranslation('RotorDiameter') }}</span> <span
                            class="status">{{ diameter
                        }}</span></li>
                    <li class="clearfix"><span class="label">{{ getTranslation('Height') }}</span> <span class="status">{{ height }}</span>
                    </li>
                    <li class="clearfix"><span class="label">{{ getTranslation('GPSLocation') }}</span> <span
                            class="status">{{ gps }}</span></li>
                </ul>
            </div>
        </div>
    </div>
</template>
<script>
    import {mapGetters} from 'vuex';
    import OverviewCard from '../overview-card/overview-card.vue';
    import windmill from '../windmill/windmill.vue';
    import WindmillClass from '../windmill/windmill.js';

    export default {
        name: "TurbineDetails",
        components: {
            OverviewCard,
        },
        data()
        {
            return {
                turbine: {
                    Latitude: null,
                    Longitude: null,
                },
                status: 'Onbekend',
                brand: 'Onbekend',
                power: `- ${this.getTranslation('kWh')}`,
                diameter: '- meter',
                height: '- meter',
                gps: '-, -',
//                markers: [{
//                    position: {lat: null, lng: null}
//                }],
                overviewCardData: {},
                coords: {
                    Latitude: null,
                    Longitude: null,
                },
                markers: [],
                minLat: 1000,
                minLng: 1000,
                maxLat: -90000,
                maxLng: -90000,
                statusClass: '',
                refresh: null,
                refreshTime: 30000,
                statusID: null,
                totalProduction: 0,
            };
        },
        computed: {
            ...mapGetters('windmills', ['getTurbineById']),
            TurbineID()
            {
                return parseInt(this.$route.params.id);
            },
            statusDescription()
            {
                return (this.turbine.StatusCodeDescription) ? this.turbine.StatusCodeDescription : false;
            },
            prognoseInfo()
            {
                return this.getTranslation('Prognoseinfotext');
            },
            overviewcardDescription()
            {
                if (this.turbine && this.turbine.DisplayName) {
                    return this.getTranslation('Overview') + ' ' + this.turbine.DisplayName;
                }
                return this.getTranslation('Overviewturbine') || '';
            },
            hasError()
            {
                return this.turbine.TurbineStatusID != 2;
            },
        },
        mounted()
        {
            this.setData(true);

            this.$store.commit('navbar/showLoading', false);
            this.setDataInterval();

            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);

        },
        beforeDestroy()
        {
            this.clearDataInterval();
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        methods: {
            setData(refresh)
            {

                let turbine;
                if (this.getHomePath() == 'turbinedetails') {
                    WindmillClass.getTurbineById(this.TurbineID, true)
                        .then(turbine => {
                            this.fillData(turbine);
                        });
                } else {
                    turbine = this.getTurbineById(this.TurbineID);
                    WindmillClass.getTurbineById(this.TurbineID, true)
                        .then(turbine => {
                            this.fillData(turbine);
                        })
                        .catch(err => {
                            this.alert(this.getTranslation("ApiError") + ' Turbine nr:' + this.TurbineID);
                            console.error(err);
                        });
                }
            },
            fillData(turbine)
            {
                let turbineStatusData = JSON.parse(localStorage.turbineStatus);
                this.turbine = turbine;
                turbine = null;

                let statusID = this.turbine.AppTurbineStatus;
                this.statusID = statusID;
                let statusMessage = _.findIndex(turbineStatusData, {'ID': statusID});

                this.status = turbineStatusData[statusMessage].DisplayName;
                this.brand = this.turbine.BrandTypeDisplayName;

                let turbinePower = numeral(this.turbine.Power).format();
                if (this.turbine.Power > 1 && this.turbine.Power > 10) {
                    turbinePower = numeral(this.turbine.Power).format('0.0');
                }
                this.power = turbinePower + ' ' + this.getTranslation('kWh');

                this.diameter = this.turbine.RotorDiameter + ' ' + this.getTranslation('Meter');
                this.height = this.turbine.Height + ' ' + this.getTranslation('Meter');

                let indicator = helpers.getStatusIndicator(this.turbine);

                if (indicator == 'warning' || indicator === 'offline') {
                    this.statusClass = 'warning';
                } else if (indicator == 'error') {
                    this.statusClass = 'error';
                }
                //set markers
                if (this.gps.indexOf('-') != -1) {
                    this.gps = this.turbine.Latitude + ', ' + this.turbine.Longitude;
                    this.setGoogleMaps();
                }

                this.totalProduction = this.turbine.BTDHourlyProductionCounterCumulative;

                let mutated = this.mutateProduction(this.totalProduction);
                let production = mutated.production;

                global.numeral.locale(localStorage.getItem('currentLang'));
                if (mutated.production > 1 && mutated.production < 10) {
                    production = numeral(mutated.production).format('0.00');
                } else {
                    production = numeral(mutated.production).format('0.00');
                }

                this.totalProduction = production + ' ' + this.getTranslation(mutated.unit);

                this.generateOverviewCardData(this.turbine);
            },
            setGoogleMaps()
            {
                GoogleMaps.load((google) => {
                    let map = new google.maps.Map(document.getElementById('gmaps'), {
                        center: new google.maps.LatLng(this.turbine.Latitude, this.turbine.Longitude),
                        mapTypeId: 'terrain',
                        gestureHandling: 'greedy',
                        zoomControl: false,
                        mapTypeControl: false,
                        scaleControl: false,
                        streetViewControl: false,
                        rotateControl: false,
                        fullscreenControl: false,
                        zoom: 16,
                    });

                    let pos = {
                        lat: this.turbine.Latitude,
                        lng: this.turbine.Longitude,
                    };

                    this.markers.push(new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: require('@/assets/images/maps/map-marker.svg'),
                    }));

                });
            },
            /**
             * generate data for overview card.
             * @param turbineData
             */
            generateOverviewCardData(turbineData)
            {
                if (turbineData) {
                    let currentProd = this.mutateProduction(turbineData.Production, true);
                    this.overviewCardData = {
                        rawdata: turbineData,
                        currentWindspeed: turbineData.Windspeed,
                        currentProduction: (this.statusID == 0) ? '--' : currentProd.production,
                        currentProductionUnit: this.getTranslation(currentProd.unit),
                        isPark: false,
                        isTotal: false,
                        ID: this.TurbineID,
                    };
                }
            },
            setDataInterval()
            {
                //first clear if set
                this.clearDataInterval();
                //set new one
                let self = this;
                this.refresh = setInterval(function () {

                    self.setData(true);

                }, self.refreshTime);//every 30 secs data refresh?
            },
            clearDataInterval()
            {
                if (this.refresh) {
                    clearInterval(this.refresh);
                }
                this.refresh = null;
            }
        },
    };
</script>