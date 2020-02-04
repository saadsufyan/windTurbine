<template>
    <div class="anim-container turbine">
        <div class="toolbar tabbar toolbar-top tabbar-scrollable">
            <div class="toolbar-inner">
                <router-link replace :to="{ name: 'turbinedetails' }" exact class="tab-link secondaryColor">
                    <div class="tablabel">Turbine</div>
                </router-link>

                <router-link replace :to="{ name: 'turbinestatistics' }" class="tab-link secondaryColor">
                    <div class="tablabel">{{ getTranslation('Statistics') }}</div>
                </router-link>

                <router-link replace :to="{ name: 'turbineweather' }" class="tab-link secondaryColor">
                    <div class="tablabel">{{ getTranslation('Weather') }}</div>
                </router-link>
                <router-link replace :to="{ name: 'turbinemanagement' }" class="tab-link secondaryColor">
                    <!--<div class="iconholder"><i class="tabicon ico-weather"></i></div>-->
                    <div class="tablabel">{{ getTranslation('Management') }}</div>
                </router-link>
                <router-link replace :to="{ name: 'turbinesettings' }" class="tab-link secondaryColor">
                    <!--<div class="iconholder"><i class="tabicon ico-weather"></i></div>-->
                    <div class="tablabel">{{ getTranslation('Settings') }}</div>
                </router-link>
            </div>
        </div>
        <transition name="anim" mode="out-in">
            <router-view class="view"></router-view>
        </transition>
    </div>

</template>
<script>
    import { mapGetters } from 'vuex';

    export default {
        name: "Turbine",
        data() {
            return {
                turbine: null,
            }
        },
        mounted() {
            this.init(parseInt(this.$route.params.id));

            $('.tab-link').on('click', function(e){
                $('.toolbar-inner').animate({ scrollLeft: $(this).position().left }, 275);
            });
        },
        computed: {
            ...mapGetters('windmills', ['getParkById', 'getTurbineById']),
        },
        methods: {
            init(id) {
                this.turbineID = id;
                this.turbine = this.getTurbineById(this.turbineID);

                this.$store.commit('navbar/showNavBar', true);
                this.$store.commit('navbar/changeWindowTitle', this.turbine.DisplayName);
            },
        },
    }
</script>