<template>
    <div id="app" :class="platform">
        <navbar/>
        <transition :name="transitionName" mode="out-in">
            <router-view class="view"></router-view>
        </transition>

        <fullPageLoader/>
    </div>
</template>
<script>

    import navbar from "./components/navigation/nav.vue";
    import fullPageLoader from "./components/full-page-loader.vue";

    export default {
        data: function () {
            return {
                title: 'component',
                showLoading: false,
                transitionName: 'anim',

            }
        },
        computed: {
            platform() {
                return (window.device && window.device.platform) ? window.device.platform.toLowerCase() : 'browser';
            },
        },
        components: {
            navbar,
            fullPageLoader
        },
        watch: {
            '$route'(to, from) {
                if (from.name == 'loginform') {
                    this.transitionName = 'initial-enter';
                } else if (to.name == 'inbox-detail') {
                    this.transitionName = '';
                } else {
                    this.transitionName = 'anim';
                }
            },
        },
    }

</script>
