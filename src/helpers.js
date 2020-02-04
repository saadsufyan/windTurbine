import $ from 'jquery';

let helpers = {};

helpers.nextInput = function () {
    $('input').on('keyup', function (e) {
        if (e.keyCode == 13) {
            let target = $(this).parent().next().find('input');
            if (target.length == 0) {
                this.blur();
            } else {
                target.focus();
            }
        }
    });
};

helpers.ripple = function () {
    $(document).on('mousedown', '.ripple', function (e) {
        let clickY = e.pageY - $(this).offset().top;
        let clickX = e.pageX - $(this).offset().left;

        let el = this;
        let svg = '<svg class="svg-ripple" style="pointer-events:none;"><circle cx="' + parseInt(clickX) + '" cy="' + parseInt(clickY) + '" r="' + 0 + '"></circle></svg>';

        $(this).find('.svg-ripple').remove();
        $(this).append(svg);

        let c = $(el).find("circle");
        c.animate({
            "r": $(el).width() * 2,
        }, {
            duration: 600,
            step: function (val) {
                c.attr("r", val);
            },
            complete: function () {
                c.fadeOut(400);
            },
        });

    });
};

helpers.getTurbineRotation = function (turbines) {
    let turbineStatus = JSON.parse(localStorage.getItem('turbineStatus'));
    if (!turbineStatus) {
        // Fallback
        turbineStatus = config.statusID;
    }
    let rotation = true;
    if (turbines.length > 0) {
        for (let turbine of turbines) {
            let status = _.findIndex(turbineStatus, (val) => {
                return val.ID == turbine.AppTurbineStatus;
            });

            if (rotation != false && status != -1) {
                rotation = turbineStatus[status].ShowTurbineRotation;
            }
        }
    } else {

        let status = _.findIndex(turbineStatus, (val) => {
            return val.ID == turbines.AppTurbineStatus;
        });

        if (rotation != false && status != -1) {
            rotation = turbineStatus[status].ShowTurbineRotation;
        }
    }
    return rotation;
};

helpers.getStatusIndicator = function (turbines) {

    let turbineStatus = JSON.parse(localStorage.getItem('turbineStatus'));

    if (!turbineStatus) {
        // Fallback
        turbineStatus = config.statusID;
    }

    let error = 'ok';
    let allStatusses = [];
    if (turbines.length > 0) {

        for (let turbine of turbines) {

            let statusIdx = _.findIndex(turbineStatus, (val) => {
                return val.ID == turbine.AppTurbineStatus;
            });

            if (statusIdx != -1) {
                error = turbineStatus[statusIdx].DisplayStatus.toLowerCase();
            }

            //add status description to list.
            allStatusses.push(error);
        }

    } else {
        let statusIdx = _.findIndex(turbineStatus, (val) => {
            return val.ID == turbines.AppTurbineStatus;
        });

        if (statusIdx != -1) {
            error = turbineStatus[statusIdx].DisplayStatus.toLowerCase();
        }

        allStatusses.push(error);
    }

    let hasWarning = allStatusses.some((status) => {
        return status === 'warning';
    });

    let hasError = allStatusses.some((status) => {
        return status === 'error';
    });

    //do we have one or more warning
    if (hasWarning) {
        error = 'warning';
    }

    //do we have one or more errors
    if (hasError) {
        error = 'error';
    }

    return error;
};

/**
 * Receives the HomePath and the Vue Route instance to check what the current route name is.
 * If the current route name is equal to the homepath, prompt the user to close the app. Do NOT go back in router
 * history, this will mess up when you continually login or logout
 * @param homepath
 * @param route
 */
helpers.onBackButton = function (homepath, app) {
    if (app.$route.name == homepath) {
        navigator.notification.confirm(
            app.getTranslation("Are you sure you want to close the app?"),  // message
            onPrompt,   // callback to invoke
            '',         // title
            [app.getTranslation("Ok"), app.getTranslation("Cancel")]              // buttonLabels
        );
    } else {
        app.$router.go(-1);
    }

    function onPrompt(res)
    {
        if (res == 1) {
            if (navigator && navigator.app) {
                if (typeof navigator.app.exitApp === 'function') {
                    navigator.app.exitApp();
                } else if (typeof navigator.app.exit === 'function') {
                    navigator.app.exit();
                }
            }
        }
    }
};

/**
 * helper to mutate/scale production (standard in kwh) into a more readable value
 * > 1000 will become mWh by Production/1000
 * < 1 will become wH by  Production* 1000;
 * we will return an object with new value + new scale/unit
 * @param production
 * @param isRealTime - if realtime it's not on kwh but kw
 */
helpers.mutateProduction = function (production, isRealTime) {
    let mutated = production;
    let unit = isRealTime ? 'kW' : 'kWh';
    let dividingUnit = 0;
    //we can only show a value of 4 digits

    if (production > 999) {
        // make it mWh
        dividingUnit = 1000;
        mutated = production / dividingUnit;
        unit = isRealTime ? 'MW' : 'MWh';
    }

    if (mutated > 999) {
        // make it gWh
        dividingUnit = 1000000;
        mutated = production / dividingUnit;
        unit = isRealTime ? 'GW' : 'GWh';
    }

    if (mutated <= 0) {
        mutated = 0;
        production = 0;
    }

    return {
        production: mutated,
        unit: unit,
        raw: production,
        dividingUnit: dividingUnit,
    };
};

/**
 * Calculate the production percentage based on the prognosis
 * If the values are lower than 0, set to 0.01 and if it's higher than 100, set it to 99.99 (the 0.01 difference is an
 * iOS bugfix for the donut chart rendering)
 * @param prognosis
 * @param production
 * @returns {{current: number, rest: number}}
 */
helpers.calculatePrognosis = function (prognosis, production) {

    if (!production) {
        return {current: 0.01, rest: 99.99};
    }

    let percentage = (production / prognosis) * 100;

    if (percentage <= 0) {
        percentage = 0.01;
    }
    let rest = 100 - percentage;
    if (rest > 100) {
        rest = 99.99;
    }
    if (rest < 0) {
        rest = 0.01;
    }

    return {current: percentage, rest: rest};
};

/**
 * convert currencyCode/-name into symbol
 * if symbol is not present, return code
 * @param currencyCode
 * @returns {*}
 */
helpers.convertCurrencyCodeToSign = function (currencyCode) {

    if (currencyCode) {

        currencyCode = currencyCode.toUpperCase();

        let currency_symbols = {
            'USD': '$', // US Dollar
            'EUR': '€', // Euro
            'CRC': '₡', // Costa Rican Colón
            'GBP': '£', // British Pound Sterling
            'ILS': '₪', // Israeli New Sheqel
            'INR': '₹', // Indian Rupee
            'JPY': '¥', // Japanese Yen
            'KRW': '₩', // South Korean Won
            'NGN': '₦', // Nigerian Naira
            'PHP': '₱', // Philippine Peso
            'PLN': 'zł', // Polish Zloty
            'PYG': '₲', // Paraguayan Guarani
            'THB': '฿', // Thai Baht
            'UAH': '₴', // Ukrainian Hryvnia
            'VND': '₫', // Vietnamese Dong
        };
        if (!currency_symbols[currencyCode]) {
            console.warn('currencySymbol for code: ' + currencyCode + ' is not found');
            return currencyCode;
        }

        return currency_symbols[currencyCode];
    }

    return currencyCode;

};

helpers.mutateMoney = function (money) {
    let mutated = money;
    let unit = '1';
    let dividingUnit = 0;
    //we can only show a value of 4 digits

    if (money > 9999) {
        //make it mWh
        mutated = money / 1000;
        unit = '1.000';
        dividingUnit = 1000;
    }

    if (money > 99999) {
        //make it mWh
        mutated = money / 10000;
        unit = '10.000';
        dividingUnit = 10000;
    }

    return {
        value: mutated,
        unit: unit,
        raw: money,
        dividingUnit: dividingUnit
    };
};
/**
 * generate options object for count-up component.
 * @param {Number} number -
 * @param {String} lang - currentlanguage (will define the decimal and seperator property
 * @param {Number}[forceDecimals] - overrule the setting for decimals you want
 * @returns {{decimals: number, decimal: string, separator: string}}
 */
helpers.getCountUpOptions = function (number, lang, forceDecimals) {
    let decimals = 0;
    let decimalSeperator = lang && lang.toLowerCase().indexOf('nl') !== -1 ? ',' : '.';
    let thousandsSeperator = lang && lang.toLowerCase().indexOf('nl') !== -1 ? '.' : ',';

    if (number && (number > 1 && number < 10)) {
        decimals = 1;
    }

    if (forceDecimals >= 0) {
        decimals = forceDecimals;
    }

    return {
        decimals: decimals,
        decimal: decimalSeperator,
        separator: thousandsSeperator,
        duration: 0.5,
    };
};
export default helpers;

