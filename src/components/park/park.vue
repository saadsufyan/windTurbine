<template>
    <div class="anim-container">
        <div class="toolbar tabbar toolbar-top tabbar-scrollable" v-if="showTab">
            <div class="toolbar-inner">
                <router-link replace :to="{ name: 'parkoverview', params: { id: this.parkID }}" exact
                             class="tab-link ripple secondaryColor">
                    <div class="tablabel">{{ getTranslation('Turbines') }}</div>
                </router-link>

                <router-link replace :to="{ name: 'parkstatistics', params: { id: this.parkID }}"
                             class="tab-link ripple secondaryColor">
                    <div class="tablabel">{{ getTranslation('Statistics') }}</div>
                </router-link>

                <router-link replace :to="{ name: 'parkweather', params: { id: this.parkID }}"
                             class="tab-link ripple secondaryColor">
                    <div class="tablabel">{{ getTranslation('Weather') }}</div>
                </router-link>

                <router-link replace :to="{ name: 'parkmap', params: { id: this.parkID }}"
                             class="tab-link ripple secondaryColor">
                    <div class="tablabel">{{ getTranslation('Map') }}</div>
                </router-link>
            </div>
        </div>

        <!--<keep-alive>-->
            <transition name="anim" mode="out-in">
                <router-view class="view"></router-view>
            </transition>
        <!--</keep-alive>-->
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'Park',
        data() {
            return {
                showTab: true,
                parkID: 0,
            }
        },
        mounted() {
            this.init(parseInt(this.$route.params.id));

            $('.tab-link').on('click', function(e){
                $('.toolbar-inner').animate({ scrollLeft: $(this).position().left }, 275);
            });
        },
        computed: {
            ...mapGetters('windmills', ['getParkById', 'getParks', 'getParkNameById']),
        },
        methods: {
            init(id) {
                if (this.getHomePath() == 'turbinedetails') {
                    this.$router.replace({ path: this.$store.getters['user/getHomeLink'] });
                }
                if (this.getHomePath() == 'parkoverview') {
                    this.setData();
                }
                this.parkID = id;
                let park = this.getParkNameById(this.parkID);
                this.$store.commit('navbar/showNavBar', true);
                this.$store.commit('navbar/changeWindowTitle', park.DisplayName);

            },
            setData() {
                // Fetch all parks
                // When this promise is resolved, the data should be available through the store, therefore we dont add a then after this promise.
                windmillClass.initialiseData()
                    .catch((error) => {
                        console.error(error);
                    });

            },
        },
    }
</script>