<template>
    <div id="search-bar" class="search-bar card row no-gutter" @click="focusInput">
        <transition-group
                name="fade"
                tag="div"
                class="windmills-container"
                v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="110"
                infinite-scroll-throttle-delay="1000">
            <singleWindmill v-for="(value, key) in computedList" :key="value.ID" :data="value"
                            class="singleWindmill"
                            :isPark="value.isPark"/>
        </transition-group>


        <div class="loader-indicator" :class="{'hidden': !busy}">
            <div class="loader-container">
                <span class="loader"></span>
            </div>
        </div>
    </div>
</template>

<script>
    import windmillClass from '../windmill/windmill.js';
    import singleWindmill from '../windmill/windmill_card.vue';

    export default {
        name: 'searchWindow',
        data: function ()
        {
            return {
                query: '',
                windmills: [],
                offset: 0,
                limit: 50,
                busy: false,
                maxTurbines: false,
            }
        },
        mounted()
        {
            let turbines = this.$store.getters['windmills/getTurbinesByQuery']('', 25, 0);
            this.windmills = turbines.turbines;
            this.focusInput();
        },
        computed: {
            searchType()
            {
                return this.$store.getters['navbar/getSearchType'];
            },
            searchId()
            {
                return this.$store.getters['navbar/getSearchId'];
            },
            searchQuery()
            {
                this.offset = 0;
                return this.$store.getters['navbar/getSearchQuery'];
            },

            // Check if the query length exceeds 0, so the turbines are initially filtered already.
            // If the list is fully shown initially, the app might be very very slow
            computedList()
            {
                return this.windmills;
            },
        },
        methods: {
            setInitialResults()
            {
                let turbines = this.$store.getters['windmills/getTurbinesByQuery'](this.searchQuery, this.limit, 0);
                this.maxTurbines = false;
                this.windmills = turbines.turbines;
            },
            loadMore()
            {
                if (this.windmills.length > 0 && this.maxTurbines === false) {
                    this.busy = true;
                    this.offset += this.limit;

                    let windmillsToAdd = this.$store.getters['windmills/getTurbinesByQuery'](this.searchQuery, this.limit, this.offset);
                    if (windmillsToAdd.turbines.length == 0) {
                        this.busy = false;
                        this.maxTurbines = true;
                        return;
                    }
                    this.maxTurbines = false;
                    this.windmills = this.windmills.concat(windmillsToAdd.turbines);
                    setTimeout(() =>
                    {
                        this.busy = false;
                    }, 250);
                }
            },
            focusInput()
            {
                $('.search-input').focus();
            },
            searchInput(event)
            {
                this.$emit('search', this.query);
            },
            checkKey(e)
            {
                e.target.blur();
            }
        },
        watch: {
            searchQuery(newValue)
            {
                if (!newValue || newValue.length === 0) {
                    this.setInitialResults();
                } else {
                    let turbines = this.$store.getters['windmills/getTurbinesByQuery'](newValue, this.limit, 0);
                    this.maxTurbines = false;
                    this.windmills = turbines.turbines;
                }
            }
        },
        components: {
            singleWindmill: singleWindmill
        }
    }
</script>
