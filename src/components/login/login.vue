<template>
    <div class="login">
        <div class="logo-container">
            <div class="logo-image">
                <img src="@/assets/images/logo.svg" alt="logo_windup">
            </div>
            <h1>WindUp</h1>
        </div>
        <transition name="login-animation" mode="out-in">
            <router-view class="container material-container transition-view"></router-view>
        </transition>
    </div>
</template>

<script>
    import hexagon from '../hexagon/hexagon.vue';
    import loader from '../loader.vue';
    export default {
        name:'login',
        mounted(){
            // Component is loaded; do stuff!
            
            // Change navbar title for this page
            this.$store.commit('navbar/showNavBar', false);
            this.$store.commit('windmills/setEmpty');
            this.$store.commit('user/setEmpty');
        },
        data: function(){
            return {
                bootState: true,
                title: 'Login',
                show: true,
            }
        },
        components: {
            hexagon: hexagon,
            loader: loader,
        }
    }
</script>
