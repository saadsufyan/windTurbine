<template>
    <div class="anim-container scroll-container">
        <div id="map" style="height:100%; width:100%;"></div>
        <div class="loading" v-bind:class="loadingScreen">
            <p>
                <i class="fa fa-circle-o-notch fa-spin"/>
                {{ getTranslation("Loading") }}
            </p>
        </div>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: "totalMap",
        data() {
            return {
                allParks: [],
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
        mounted() {
            setTimeout(() => {
                this.drawMap();
            },500);

        },
        computed: {
            ...mapGetters('windmills', ['getParks']),
            loadingScreen() {
                return (this.loading) ? 'visible' : 'hidden';
            },
            parks(){
                if(this.getParks && this.getParks.parks.length > 0){
                    return this.getParks.parks;
                }
                return [];
            }
        },
        methods: {
            drawMap() {
                this.loading = true;
                let self = this;

                if (this.parks.length == 0) {
                    this.alert('Geen gegevens om te tonen');
                    return false;
                }

                GoogleMaps.load((google) => {


                    let map = new google.maps.Map(document.getElementById('map'), {
                        center: new google.maps.LatLng(52.1659699, 5.604023),
                        zoom: 5,
                        gestureHandling: 'greedy',
                        mapTypeId: 'terrain',
                        disableDefaultUI: true,
                    });

                    let bounds = new google.maps.LatLngBounds();

                    if (this.parks.length > 0) {
                        _.each(this.parks, (park) => {

                            _.each(park.turbineLocations, (location) => {

                                bounds.extend(location.position);

                                let marker = new google.maps.Marker({
                                    position: location.position,
                                    map: map,
                                    title: location.label,
                                    icon: require('@/assets/images/maps/map-marker.svg'),
                                    color: '#FFFFFF',
                                    fontSize: 12,
                                    turbineID: location.turbineId,
                                });

                                const infoWindowContent = `
                                    <div class="info-window-content" data-target="${location.turbineId}">
                                        <p>${location.label}</p>
                                        <p class="link">${this.getTranslation("Details")}</p>
                                    </div>
                                `


                                let infoWindow = new google.maps.InfoWindow({
                                    content: infoWindowContent,
                                    turbineId: location.turbineId,
                                    maxWidth: 360,
                                });
                                google.maps.event.addListener(marker, 'click', () => {

                                    for (var i = 0; i < self.infoWindows.length; i++ ) {  //I assume you have your infoboxes in some array
                                        self.infoWindows[i].close();
                                    }
                                    infoWindow.open(map, marker);
                                });
                                this.infoWindows.push(infoWindow);
                                this.markers.push(marker);
                            });
//
                        });
                        $(document).on('click', '.info-window-content', function() {
                            self.$router.push('/turbine/' + $(this).data('target'));
                        });

                    }
                    let markerCluster = new MarkerClusterer(map, this.markers, {
                        imagePath: require('@/assets/images/maps/map-marker-pin.png'),
                        textSize: 12,
                        textColor: 'white',
                        cssClass: 'windup-clusterer',
                    });

                    google.maps.event.addDomListener(map, "click", function(event) {
                        for (var i = 0; i < self.infoWindows.length; i++ ) {  //I assume you have your infoboxes in some array
                            self.infoWindows[i].close();
                        }
                    });

                    map.fitBounds(bounds);
                });

                this.loading = false;
            },
        },
        watch: {
            parks(newValue) {
                if (newValue && newValue.length > 0) {
                    this.drawMap();
                } else {
                    this.loading = true;
                    this.alert('Fout bij inladen gegevens');
                }
            },
        },
    }
</script>