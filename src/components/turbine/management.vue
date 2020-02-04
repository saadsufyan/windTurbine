<template>
    <div class="anim-container hasTabBar management turbine-details">
        <div class="card">
            <div class="status-holder title">
                <span class="status-text">
                    <p>{{ getTranslation('Turbine status') }}: {{status}}</p>
                </span>
                <span class="status-icon status-bulb" :class="statusClass"></span>
            </div>
            <div class="status-holder subtitle status-text" v-if="statusDescription.length >= 1">
                <p>{{ getTranslation("Statuscode") }}: {{ statusDescription }}</p>
            </div>
        </div>
        <div class="card">
            <p class="title">
                {{ turbine.DisplayName}}
            </p>

            <div class="management-container">
                <div class="action-container">
                    <div class="management-action" v-for="(control, idx) in controls" :key="idx"
                         @click="handleControl(control)" :class="{'hidden': busyQueue}">
                        <button class="button regular management-btn">{{ control.Label }}</button>
                    </div>
                </div>
                <div class="busy-queue" :class="{'visible': busyQueue}">
                    <div class="loader-container">
                        <span class="loader"></span>
                        <p>{{ getTranslation("queueBusy") }}</p>
                    </div>
                </div>
            </div>
        </div>
        <!--<p class="access-info">{{ getTranslation('Don\'t have access to the premium features?') }}</p>-->
        <!--<a :href="mail" class="button regular center">{{ getTranslation("Mail Windup") }}</a>-->


        <modal @close="closeModal(false)" v-show="modalVisible">
            <div slot="header" class="header-content">{{ actionTitle }}</div>
            <div slot="body" class="body-content">
                <input type="text" v-model="currentInput" :placeholder="getTranslation('Value')">
            </div>
            <div slot="footer" class="footer-content">
                <div class="footer-button" @click="closeModal(false)">{{getTranslation('Cancel')}}</div>
                <div class="footer-button" @click="saveSelection">{{getTranslation('Ok')}}</div>
            </div>
        </modal>
    </div>
</template>
<script>
    import {mapGetters} from 'vuex';

    import modal from '../../components/modal.vue';

    export default {
        name: "TurbineManagement",
        data()
        {
            return {
                turbine: {},
                controls: [],
                busyQueue: false,
                intervalTimer: 5000,
                fetchInterval: null,

                status: '-',
                statusID: 0,

                modalVisible: false,
                actionTitle: '',
                currentInput: '',
                currentParam: '',
                currentAction: null,
                statusDescription: '',

                // @TODO:: API needs to make global information like this available.
                mail: 'mailto:info@windup.nl',
            };
        },
        computed: {
            ...mapGetters('windmills', ['getTurbineById']),

            statusClass()
            {
                if (this.statusID == 2) {
                    return '';
                } else if (this.statusID == 3) {
                    return 'error';
                } else {
                    return 'warning';
                }
            },
        },
        mounted()
        {
            let turbine = this.getTurbineById(this.$route.params.id);
            this.turbine = turbine;
            this.getTurbineControls();
            this.fetchTurbineStatus();
            this.setDataInterval();

            this.addAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        beforeDestroy()
        {
            this.clearDataInterval();
            //if this component is destroyed, we remove the eventlisteners
            this.removeAppPauseResumeListeners(this.clearDataInterval, this.setDataInterval, false);
        },
        methods: {
            getTurbineControls()
            {
                this.$store.commit('navbar/showLoading', true);
                window.axios.get('Turbines/' + this.$route.params.id + '/Command/List')
                    .then(response => {
                        this.controls = response.data.TurbineCommandList;
                        this.$store.commit('navbar/showLoading', false);
                    })
                    .catch(error => {
                        this.$store.commit('navbar/showLoading', false);
                    });
            },
            handleControl(control)
            {
                if (this.busyQueue) {
                    return;
                }

                if (control.Parameters) {

                    /**
                     * Parameters are given in string format.
                     * Example: "ParameterNaam1:int;ParameterNaam2:text;ParameterNaam3:float"
                     * Split on `;` to get the single parameter. API dev says always use the first one
                     * Split the single parameter on `:` to get the param label and the param type
                     */

                    let param = control.Parameters.split(';');
                    if (param) {
                        param = param[0];
                        let singleParam = param.split(':');
                        this.actionTitle = singleParam[0];
                        this.currentParam = singleParam[0];
                        this.currentParamType = singleParam[1];
                        this.currentAction = control;
                        this.modalVisible = true;
                    } else {
                        this.alert(this.getTranslation("Error"));
                    }
                } else {
                    this.submitCommand(control);
                }
            },

            submitCommand(control)
            {
                this.busyQueue = true;

                if (this.currentParam) {
                    window.axios.defaults.headers.parameter = this.currentInput;

                    // Reset the used params
                    this.currentParam = '';
                    this.currentInput = '';
                    this.actionTitle = '';
                    this.currentAction = null;
                }

                window.axios.defaults.headers.command = control.TurbineCommand;
                window.axios.put('Turbines/' + this.$route.params.id + '/Command/Submit')
                    .then(response => {
                        this.$store.commit('navbar/showLoading', false);
                        this.fetchTurbineStatus();
                    })
                    .catch(error => {
                        this.$store.commit('navbar/showLoading', false);
                        this.busyQueue = false;
                    });
            },

            /**
             * Sets a dummy "interval" based on a async API call with a timeout to check the current Turbine status.
             * The server is queueing the turbine commands and then sends a command to a third party tool.
             * The third party tool does not give an instant response, so the server also has a cron to check what the status is.
             */
            fetchTurbineStatus()
            {

                // @TODO:: check with Sander / Walther to test this!!!
                window.axios.get('Turbines/' + this.$route.params.id + '/Command/QueueStatus')
                    .then(response => {
                        let res = response.data.TurbineCommandQueueStatus;

                        let turbineStatusData = JSON.parse(localStorage.turbineStatus);
                        this.statusID = res[0].AppTurbineStatus;
                        let statusMessage = _.findIndex(turbineStatusData, {'ID': this.statusID});
                        this.status = turbineStatusData[statusMessage].DisplayName;

                        if (res[0].LowLevelStatusDescription) {
                            this.statusDescription = res[0].LowLevelStatusDescription;
                        }

                        /**
                         * If no more queued commands are set, set this.busyQueue = false;
                         * Otherwise setTimeout with this function and this.intervalTimer;
                         */
                        if (res[0].QueuedCommands != 0) {
                            this.busyQueue = true;
                            setTimeout(() => {
                                this.fetchTurbineStatus();
                            }, this.intervalTimer);
                        } else {
                            this.busyQueue = false;
                        }
                    })
                    .catch(error => {
                        this.$store.commit('navbar/showLoading', false);
                    });
            },
            closeModal()
            {
                this.modalVisible = false;
            },
            saveSelection()
            {
                this.submitCommand(this.currentAction);
                this.closeModal();
            },
            setDataInterval()
            {
                this.clearDataInterval();//clear first if set

                this.fetchInterval = setInterval(this.fetchTurbineStatus, this.intervalTimer);
            },
            clearDataInterval()
            {

                if (this.fetchInterval) {
                    clearInterval(this.fetchInterval);
                }

                this.fetchInterval = null;
            }
        },
        components: {
            modal,
        },
    };
</script>