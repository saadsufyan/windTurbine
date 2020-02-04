<template>
    <span>
        <span :id="label" v-show="number">
            {{displayNumber}}
        </span>
        <span v-show="!number">
            0
        </span>
    </span>
</template>

<script>
    export default {
        name: 'count-up-number',
        props: {
            'number': {
                required: true,
                default: () => {
                    return 0;
                },
            },
            'label': {
                //this will be set as id of the span, make sure it is unique
                //otherwise CountUp won't work, it needs to getElementById (in this case the label)
                required: true,
                default: () => {
                    return 'count-up';
                },
            },
            'options': {
                required: false,
                default: () => {
                    return {
                        useEasing: true,
                        useGrouping: true,
                        separator: '.',
                        decimal: ',',
                        prefix: '',
                        suffix: '',
                        duration: 0.75,
                        decimals: 0,
                    }
                },
            },
        },
        data: function () {
            return {
                displayNumber: 0,
            }
        },
        mounted() {
            this.animateNumber(this.number);
        },
        methods: {
            animateNumber(number){
                if (number == '--') {
                    return this.displayNumber = number;
                }
                if (number) {
                    try {
                        let animatedNumber = new CountUp(this.label, this.displayNumber, number, this.options.decimals, this.options.duration, this.options);

                        if (!animatedNumber.error) {
                            animatedNumber.start();
                        }
                    } catch(e) {}
                    this.displayNumber = number;
                }
            },
        },
        watch: {
            number(newValue) {
                if (newValue == '--') {
                    this.animateNumber(newValue);
                    return;
                }
                if (typeof newValue == 'string' && newValue != null) {
                    newValue = parseFloat(newValue);
                }

                if (typeof newValue == 'number') {
                    this.animateNumber(newValue);
                }
            },

        },
    }

</script>
