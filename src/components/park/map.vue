<template>
    <div class="anim-container park-map scroll-container hasTabBar">
        <div class="card" style="height: 85%; width:90%; margin:3% 5%">
            <div id="map" style="height:100%; width:100%;"></div>
            <div class="loading" v-bind:class="loadingScreen">
                <p>
                    <i class="fa fa-circle-o-notch fa-spin"/>
                    {{ getTranslation("Loading") }}
                </p>
            </div>
        </div>
    </div>
</template>

<script>
    import {mapGetters} from 'vuex';

    export default {
        name: "OverviewMap",
        data()
        {
            return {
                TurbineID: null,
                loading: true,
                coords: {
                    Latitude: null,
                    Longitude: null,
                },
                markers: [],
                infoWindows: [],
                minLat: 1000,
                minLng: 1000,
                maxLat: -90000,
                maxLng: -90000,
            }
        },
        mounted()
        {
            this.loading = true;
            this.ParkID = this.$route.params.id;

            this.$nextTick(() =>
                {
                    //must be done in next tick, otherwise getters is not loaded.
                    let park = this.getParkById(this.ParkID);
                    let turbines = park.parks[0].Turbines;

                    this.setGoogleMaps(turbines);

                    this.loading = false;
                }
            );


        },
        computed: {
            ...mapGetters('windmills', ['getParkById', 'getParks', 'getTurbineById', 'getParkNameById']),
            loadingScreen()
            {
                return (this.loading) ? 'visible' : 'hidden';
            }
        },
        methods: {
            setGoogleMaps(turbines)
            {
                let self = this;

                GoogleMaps.load((google) =>
                {
                    let map = new google.maps.Map(document.getElementById('map'), {
                        center: new google.maps.LatLng(52.1659699, 5.604023),
                        zoom: 12,
                        gestureHandling: 'greedy',
                        mapTypeId: 'terrain',
                        disableDefaultUI: true
                    });

                    let bounds = new google.maps.LatLngBounds();

                    if (turbines && turbines.length > 0) {
                        _.each(turbines, (val) =>
                        {

                            if (val.Latitude < this.minLat) {
                                this.minLat = val.Latitude;
                            }
                            if (val.Longitude < this.minLng) {
                                this.minLng = val.Longitude;
                            }
                            if (val.Latitude > this.maxLat) {
                                this.maxLat = val.Latitude;
                            }
                            if (val.Longitude > this.maxLng) {
                                this.maxLng = val.Longitude;
                            }

                            this.coords.Latitude = val.Latitude;
                            this.coords.Longitude = val.Longitude;

                            let pos = {
                                lat: val.Latitude,
                                lng: val.Longitude,
                            };

                            bounds.extend(pos);

                            let marker = new google.maps.Marker({
                                position: pos,
                                map: map,
                                label: "",
                                icon: require('@/assets/images/maps/map-marker.svg'),
                                turbineID: val.TurbineID,
                            });

                            const infoWindowContent = `
                                    <div class="info-window-content" data-target="${val.TurbineID}">
                                        <p>${val.DisplayName}</p>
                                        <p class="link">${this.getTranslation("Details")}</p>
                                    </div>
                                `


                            let infoWindow = new google.maps.InfoWindow({
                                content: infoWindowContent,
                                turbineId: location.turbineId,
                                maxWidth: 360,
                            });
                            google.maps.event.addListener(marker, 'click', () =>
                            {
                                for (var i = 0; i < self.infoWindows.length; i++) {  //I assume you have your infoboxes in some array
                                    self.infoWindows[i].close();
                                }

                                infoWindow.open(map, marker);
                            });

                            this.infoWindows.push(infoWindow);
                            this.markers.push(marker);
                        });

                        $(document).on('click', '.info-window-content', function ()
                        {
                            self.$router.push('/turbine/' + $(this).data('target'));
                        });

                        let markerCluster = new MarkerClusterer(map, this.markers, {
                            imagePath: 'assets/images/maps/map-marker-pin',
                            textSize: 12,
                            textColor: 'white',
                            cssClass: 'windup-clusterer',
                        });
                    }

                    google.maps.event.addDomListener(map, "click", function (event)
                    {
                        for (var i = 0; i < self.infoWindows.length; i++) {  //I assume you have your infoboxes in some array
                            self.infoWindows[i].close();
                        }
                    });

                    map.fitBounds(bounds);
                });
            }
        }
    }
</script>