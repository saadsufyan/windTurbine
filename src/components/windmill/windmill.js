import store from '../../store';

const Windmill = {
    windmillsSorted: [],
    intervalTypes: {
        seconds: 10,
        minutes: 11,
        hours: 12,
        day: 13,
        week: 14,
        month: 15,
        quarterly: 16,
        year: 17,
        lifeSampleDetails: 0,
        total: -1,
        tenMinAverage: 18,
    },
};

Windmill.fetchFromApi = function (url) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    // Communicate to api;
    return new Promise((resolve, reject) => {

        window.axios.get(url)
            .then((response) => {
                if (response.data.length !== 0 || Object.keys(response.data).length !== 0) {
                    resolve(response.data);
                } else {
                    reject(error);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
};

Windmill.sortByParks = function (turbines) {
    let newArray = [];
    turbines.forEach(function (val, index) {

        // Parent array block
        let target = val.ParkID;

        let curr = newArray[target];

        //if array key doesnt exist, init with empty array
        if (!curr) {
            newArray[target] = [];
        }

        newArray[target].push(val);
    });

    return newArray;
};

Windmill.getEnumeration = function (enumeration) {
    return this.fetchFromApi('Enumerations/' + enumeration);
};

Windmill.getWeatherForTurbines = function (turbines) {
    let promiseArray = [];
    let parkos = [];

    turbines.forEach(function (turbine) {
        let targetTurbine = turbine;

        let deffered = new Promise((resolve, reject) => {
            getTurbineWeather(targetTurbine.TurbineID)
                .then((response) => {
                    targetTurbine.weather = response.data.WeatherForecastData;
                    parkos.push(targetTurbine);
                    resolve(targetTurbine);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
        promiseArray.push(deffered);
    });

    return Promise.all(promiseArray)
        .then((data) => {
            let parkData = {turbines: parkos, merge: true};
            store.commit('windmills/setTurbines', parkData);

            return store.getters['windmills/getTurbines'];

        }).catch((error) => {
            console.error(error);
        });
};
/**
 * for all parks, get the chartData which holds production, windspeed and prognosed production (percentage)
 * @param parks
 * @returns {Promise.<*[]>}
 */
Windmill.getChartDataForParks = function (parks) {

    let promiseArray = [];
    let yearInterval = this.intervalTypes['year'];
    let monthInterval = this.intervalTypes['month'];

    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate('month');
    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();

    parks.forEach(function (park) {
        //for each park, get monthly and yearly chartData in a promise.all, resolve the result and push this promise in
        // the promise array.
        promiseArray.push(
            new Promise((resolve, reject) => {

                Promise.all([new Promise((resolve, reject) => {
                    //specific headers
                    window.axios.defaults.headers.UTZStartDate = getUTZStartDate('month');
                    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
                    resolve(getParkChartDataById(park.ID, monthInterval));

                }),
                    new Promise((resolve) => {
                        //specific headers
                        window.axios.defaults.headers.UTZStartDate = getUTZStartDate('year');
                        window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
                        resolve(getParkChartDataById(park.ID, yearInterval));
                    }),

                ])
                    .then(([chartDataMonth, chartDataYear]) => {
                        park.chartData = {month: chartDataMonth.data, year: chartDataYear.data};
                        resolve(park);
                    })
                    .catch((err) => {
                        resolve(park);
                    });
            }),
        );
    });

    //execute all Promises
    return Promise.all(promiseArray);
};

Windmill.getChartDataForTurbines = function (turbines) {

    let promiseArray = [];
    let yearInterval = this.intervalTypes['year'];
    let monthInterval = this.intervalTypes['month'];

    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate('month');
    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();

    turbines.forEach(function (turbine) {
        //for each park, get monthly and yearly chartData in a promise.all, resolve the result and push this promise in
        // the promise array.
        promiseArray.push(
            new Promise((resolve, reject) => {

                Promise.all([
                    new Promise((resolve, reject) => {
                        //specific headers
                        window.axios.defaults.headers.UTZStartDate = getUTZStartDate('month');
                        window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
                        resolve(getTurbineChartDataById(turbine.TurbineID, monthInterval));

                    }),
                    new Promise((resolve) => {
                        //specific headers
                        window.axios.defaults.headers.UTZStartDate = getUTZStartDate('year');
                        window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
                        resolve(getTurbineChartDataById(turbine.TurbineID, yearInterval));
                    }),
                ])
                    .then(([chartDataMonth, chartDataYear]) => {
                        turbine.chartData = {month: chartDataMonth.data, year: chartDataYear.data};
                        resolve(turbine);
                    })
                    .catch((err) => {
                        resolve(turbine);
                    });
            }),
        );
    });

    //execute all Promises
    return Promise.all(promiseArray);
};
/**
 * this method merges all the data into park scoped object.
 * containing realtime parkdata (production, windspeed etc) based on all realtime turbine data
 * after all, a park is just a set of turbines.
 * add up the production of all turbines and you will get the production of a park.
 *
 * so we will first loop over all turbines. matching
 *
 * @param {Object[]} parks
 * @param {Object[]} turbines - array with objects with all properties matching turbineID
 * @param {Object[]} parkTurbines - array with objects containing ParkID and TurbineID as a relational table
 * @returns {*}
 */
Windmill.mutateParkObject = (parks, turbines, parkTurbines) => {

    let count = 0;
    let turbineCount = 0;
    let parkCount = 0;
    //total values over all parks
    let totalProduction = 0;
    let totalRealTimeProduction = 0;
    let totalParkSpeed = 0;
    let totalTurbineSpeed = 0;
    let totalRotorRPM = 0;
    let totalkWhPrice = 0;
    let totalEarnings = 0;
    let allTurbines = [];

    let usedTurbine = {};

    parks.map((park) => {
        park.Turbines = [];

        parkTurbines.forEach((val, idx) => {
            if (park.ID == val.ParkID) {
                park.Turbines.push(val.TurbineID);
            }
        });

        park.isPark = true;
        return park;
    });

    //for each park, loop over its turbines, collect park totals and total production over all parks
    parks.map((park) => {

        let pcount = 0;
        let ptotalSpeed = 0;
        let ptotalProduction = 0;
        let pcurrentProduction = 0;
        let pRotorRPM = 0;
        let pPower = 0;
        let pTotalKwHPrice = 0;
        let turbineLocations = [];

        park.Turbines.forEach((val, idx) => {

            let turbineIdx = _.findIndex(turbines, (sval, idx) => {
                return sval.TurbineID == val;
            });

            if (idx != -1) {
                park.Turbines[idx] = turbines[turbineIdx];
                park.Turbines[idx].isPark = false;
            }

            // Generate Park data
            let turbine = park.Turbines[idx];
            if (!usedTurbine[turbine.TurbineID]) {

                if (typeof turbine.Windspeed == 'number') {
                    totalParkSpeed += parseFloat(turbine.Windspeed);
                }

                if (typeof turbine.Production == 'number') {
                    totalRealTimeProduction += parseFloat(turbine.Production);
                }

                if (typeof turbine.BTDHourlyProductionCounterCumulative == 'number') {
                    totalProduction += parseFloat(turbine.BTDHourlyProductionCounterCumulative);
                }

                if (typeof turbine.RotorRPM == 'number') {
                    totalRotorRPM += parseFloat(turbine.RPMRotor);
                }

                if (typeof turbine.Production == 'number' && typeof turbine.kWhPrice == 'number') {
                    totalEarnings += (parseFloat(turbine.Production) * turbine.kWhPrice);
                }

                if (typeof turbine.kWhPrice == 'number') {
                    totalkWhPrice += turbine.kWhPrice;
                }

                usedTurbine[turbine.TurbineID] = 1;

            }

            if (typeof turbine.BTDHourlyProductionCounterCumulative == 'number') {
                ptotalProduction += parseFloat(turbine.BTDHourlyProductionCounterCumulative);
            }

            //only add up if the value exists, so skip undefined to prevent NaN
            if (typeof turbine.Production == 'number') {
                pcurrentProduction += parseFloat(turbine.Production);
            }

            if (typeof turbine.Windspeed == 'number') {
                totalTurbineSpeed = ptotalSpeed += parseFloat(turbine.Windspeed);
            }

            if (typeof turbine.RPMRotor == 'number') {
                pRotorRPM += parseFloat(turbine.RPMRotor);
            }

            if (typeof turbine.Power == 'number') {
                pPower += parseFloat(turbine.Power);
            }

            if (typeof turbine.kWhPrice == 'number') {
                pTotalKwHPrice += turbine.kWhPrice;
            }
            //add location of turbine, to be used in google maps to form marker cluster
            turbineLocations.push({
                position: {
                    lat: turbine.Latitude,
                    lng: turbine.Longitude,
                },
                turbineId: turbine.TurbineID,
                label: turbine.DisplayName,
            });
        });

        turbineCount += park.Turbines.length;

        park.turbineLocations = turbineLocations;
        park.Windspeed = ptotalSpeed / park.Turbines.length;//current/realtime windspeed (average of total of all
                                                            // turbines in park)
        park.RealTimeProduction = pcurrentProduction;
        park.Production = ptotalProduction;//realtime production of park (Total of all turbines in park)
        park.isPark = true;//flag to mark this object as a park.
        park.RotorRPM = pRotorRPM / park.Turbines.length;//average RotorRPM
        park.Power = pPower / park.Turbines.length;//current/realtime Power of park (total of all turbines in park)
        park.averageKwHPrice = pTotalKwHPrice / park.Turbines.length; //(turbines have a kwhPrice)
        park.earnings = park.RealTimeProduction * park.averageKwHPrice;//current/realtime earnings of park (all
                                                                       // turbines.Production in park)

        return park;
    });

    let totalAvgProduction = totalProduction / Object.keys(usedTurbine).length;
    // let totalAvgSpeed = totalParkSpeed / parks.length;
    let totalAvgSpeed = totalParkSpeed / Object.keys(usedTurbine).length;
    let totalAvgRotorRPM = totalRotorRPM / Object.keys(usedTurbine).length;
    let averageKwhPrice = totalkWhPrice / Object.keys(usedTurbine).length;
    let totalAvgEarnings = totalAvgProduction * averageKwhPrice;

    if (parks.length > 1) {
        parks.average = {
            Production: totalAvgProduction,
            Windspeed: totalAvgSpeed,
            RotorRPM: totalAvgRotorRPM,
            Earnings: totalAvgEarnings,
            kWhPrice: averageKwhPrice,
        };

        //totals - over all parks
        parks.total = {
            RealTimeProduction: totalRealTimeProduction,
            Production: totalProduction,
            Windspeed: totalParkSpeed,
            RotorRPM: totalRotorRPM,
            Earnings: totalEarnings,
        };

        parks.totalParkCount = parks.length;
        parks.totalTurbineCount = turbineCount;
        //average values of all parks

        // Initially save the parks / turbines / parkturbines to the localStorage, so we can later update the record
        localStorage.setItem('parkTurbines', JSON.stringify(parkTurbines));
        localStorage.setItem('windmills', JSON.stringify(parks));
        localStorage.setItem('turbines', JSON.stringify(allTurbines));

    } else {

        parks[0].average = {
            Production: totalAvgProduction,
            Windspeed: totalAvgSpeed,
            RotorRPM: totalAvgRotorRPM,
            Earnings: totalAvgEarnings,
            kWhPrice: averageKwhPrice,
        };

        //totals - over all parks
        parks[0].total = {
            Production: totalProduction,
            Windspeed: totalParkSpeed,
            RotorRPM: totalRotorRPM,
            Earnings: totalEarnings,
        };

        parks[0].totalParkCount = parkCount;
        parks[0].totalTurbineCount = turbineCount;

        // Update/mutate a single park and add it to the localStorage
        let localParks = JSON.parse(localStorage.getItem('windmills'));
        let parkToFind = _.findIndex(localParks, {'ID': parks[0].ID});

        localParks[parkToFind] = parks[0];
        localStorage.setItem('windmills', JSON.stringify(localParks));
        return parks[0];
    }

    return parks;
};

/**
 * get realtime park data and turbines for this park by Id
 * @param id
 * @param refresh
 * @returns {*}
 */
Windmill.getParkById = function (id, refresh) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    let park = store.getters['windmills/getParkById'](id);

    if (park && refresh !== true) {
        return new Promise((resolve, reject) => {
            //give park some extra data (realtime production etc.)
            resolve(park);
        });
    }

    return Promise.all([getParkTurbines(id), getParkRealTime(id)])
        .then(([turbines, realtime]) => {
            store.commit('windmills/setTurbines', {
                turbines: turbines.data.TurbineData,
                realtime: realtime.data,
            });

            let park = store.getters['windmills/getParkById'](id);

            return Windmill.mutateParkObject(park.parks, park.turbines, park.parkTurbines);

        })
        .catch((error) => {
            return Promise.reject(error);
        });
};

/**
 * get realtime data for turbine by Id
 * @param id
 * @param refresh
 * @returns {*}
 */
Windmill.getTurbineById = function (id, refresh = false) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    let turbine = store.getters['windmills/getTurbineById'](id);

    if (turbine && refresh !== true) {
        return new Promise((resolve, reject) => {
            //give park some extra data (realtime production etc.)
            resolve(turbine);
        });
    }

    return Promise.all([getTurbine(), getTurbineRealTime(id)])
        .then(([turbine, realtime]) => {
            store.commit('windmills/setTurbines', {
                turbines: turbine.data.TurbineData,
                realtime: realtime.data,
                merge: true,
            });

            return store.getters['windmills/getTurbineById'](id);
        })
        .catch((error) => {
            return Promise.reject(error);
        });
};

/**
 * Get Prognosis of the park
 * @param id - id of the park
 * @param intervalId - string
 *
 */
Windmill.getParkPrognosisById = function (id, intervalId) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.intervaltypeid = intervalId;

    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(intervalId);

    return getPrognosisParkInterval(id, intervalId);//manipulation will be done in calling controller.
};

/**
 * Get prognosis for a turbine. based on intervalId (day, month,year, total)
 * @param id
 * @param intervalId
 * @returns {*}
 */
Windmill.getTurbinePrognosisById = function (id, intervalId) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.intervaltypeid = intervalId;

    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(intervalId);

    return getPrognosisTurbineInterval(id, intervalId);//manipulation will be done in calling controller.
};
/**
 * get prognosis for user's turbines (total overview)
 * @param intervalId
 * @returns {*}
 */
Windmill.getUserPrognosisById = function (intervalId) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.intervaltypeid = intervalId;

    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(intervalId, false);
    return getUserPrognosisById(intervalId);//manipulation will be done in calling controller.
};

/**
 * Get Chartdata (statistics) of the park
 * @param id - id of the park
 * @param intervalId - string
 *
 */
Windmill.getParkChartDataById = function (id, intervalId) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(intervalId);

    let actualInterval = getRealIntervalType(intervalId);

    if (this.intervalTypes[actualInterval]) {
        actualInterval = this.intervalTypes[actualInterval];
    }
    return getParkChartDataById(id, actualInterval);//manipulation will be done in calling controller.
};

/**
 * Get chartdata/statistics for a turbine. based on intervalId (day, month,year, total)
 * @param id
 * @param intervalId
 * @returns {*}
 */
Windmill.getTurbineChartDataById = function (id, intervalId) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(intervalId);

    let actualInterval = getRealIntervalType(intervalId);

    if (this.intervalTypes[actualInterval]) {
        actualInterval = this.intervalTypes[actualInterval];
    }

    return getTurbineChartDataById(id, actualInterval);//manipulation will be done in calling controller.
};
/**
 * get all parks + turbines + realtime data from api and save in local storage systems
 * @returns {Promise.<TResult>}
 */
Windmill.initialiseData = function () {

    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return Promise.all([getEnumeration('AppTurbineStatusCompactList'), getAssets(), getRealTime()])
        .then(
            ([appTurbineList, assets, realtime]) => {

                // Set compact listings
                localStorage.turbineStatus = JSON.stringify(appTurbineList.data.AppTurbineStatusCompactList);

                let weatherData = {
                    locations: assets.data.WeatherForecastLocation,
                    data: assets.data.WeatherForecastLocationData,
                };

                store.commit('windmills/setWeatherLocations', weatherData);
                store.commit('ui/setData', assets.data.UIElementData);
                store.commit('windmills/setConstants', assets.data.Constants);

                //save relationaldata (parkTurbines, containing objects with parkID and turbineID, turbines can be
                // member of multiple parks)
                store.commit('windmills/setParkTurbines', {parkTurbines: assets.data.ParkTurbineData});

                // Set turbine data to merge with realtime data store
                let turbinesData = {turbines: assets.data.TurbineData, realtime: realtime.data};

                store.commit('windmills/setTurbines', turbinesData);
                store.commit('languages/setData', {data: assets.data.LocalizationData});

                // Set park data store
                let parkData = {'parks': assets.data.ParkData};

                store.commit('windmills/setParks', parkData);
                return Promise.resolve(parkData);
            })
        .catch((error) => {
            return error;
        });
};

Windmill.getAssets = function () {
    let self = this;

    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return getAssets()
        .then((assets) => {
            store.commit('languages/setData', {data: assets.data.LocalizationData});
            store.commit('windmills/setWeatherLocations', {
                locations: assets.data.WeatherForecastLocation,
                data: assets.data.WeatherForecastLocationData,
            });
        })
        .catch((error) => {
            console.error(error);
        });
};

Windmill.getRealTimeParks = function () {

    return new Promise((resolve, reject) => {
        this.fetchFromApi('Turbines/RealTime')
            .then((data) => {
                store.commit('windmills/setTurbines', {realtime: data});

                let parks = this.$store.getters['windmills/getParks'];
                parks = Windmill.mutateParkObject(parks.parks, parks.turbines, parks.parkTurbines);
                resolve(parks);
            })
            .catch((data) => {
                reject(data);
            });
    });
};

Windmill.getWeatherForParks = function (parks) {
    let promiseArray = [];
    let parkos = [];

    localStorage.parks = JSON.stringify(parks);

    parks.forEach(function (park) {
        let targetPark = park;

        let deffered = new Promise((resolve, reject) => {
            getParkWeather(targetPark.ID)
                .then((response) => {
                    targetPark.weather = response.data.WeatherForecastData;
                    parkos.push(targetPark);
                    resolve(targetPark);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
        promiseArray.push(deffered);
    });

    return Promise.all(promiseArray)
        .then((data) => {
            let parkData = {'parks': parkos};
            store.commit('windmills/setParks', parkData);

            let parks = this.$store.getters['windmills/getParks'];
            return Windmill.mutateParkObject(parks.parks, parks.turbines, parks.parkTurbines);

        }).catch((error) => {
            console.error(error);
        });
};

Windmill.getParkWeatherById = function (id) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return getParkWeather(id)
        .then((result) => {

            return {
                result: true,
                weather: result.data.WeatherForecastData,
            };
        })
        .catch((err) => {
            console.error(err);
            return err;
        });
};

Windmill.getTurbineWeatherById = function (id) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return getTurbineWeather(id)
        .then((result) => {
            return {
                result: true,
                weather: result.data.WeatherForecastData,
            };
        })
        .catch((err) => {
            console.error(err);
            return err;
        });
};

Windmill.getTurbinePrognosisDefaults = function (id) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return getPrognosisTurbineDefault(id)
        .then((result) => {
            return {
                result: true,
                prognosis: result.data.PrognosisDefaultsData,
            };
        })
        .catch((err) => {
            console.error(err);
            return err;
        });
};

Windmill.getTurbinePrognosisIntervalById = function (id, interval) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return getPrognosisTurbineInterval(id, interval)
        .then((result) => {
            return {
                result: true,
                prognosis: result.data.PrognosisDefaultsData,
            };
        })
        .catch((err) => {
            console.error(err);
            return err;
        });
};

Windmill.getParkPrognosisInterval = function (id, interval) {
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    return getPrognosisParkInterval(id, interval)
        .then((result) => {
            return {
                result: true,
                prognosis: result.data.PrognosisData,
            };
        })
        .catch((err) => {
            console.error(err);
            return err;
        });
};

/**
 * example: intervalId : day actually is hours
 * @param intervalId
 */
function getRealIntervalType(intervalId)
{
    let actualInterval = intervalId;
    switch (intervalId) {
        case 'day':
            actualInterval = 'hours';
            break;
        case 'week':
            actualInterval = 'day';
            break;
        case 'month':
            actualInterval = 'day';
            break;
        case 'year':
            actualInterval = 'month';
            break;
        case 'total':
            actualInterval = 'year';
            break;
        default:
            actualInterval = intervalId;
            break;
    }
    return actualInterval;

}

/**
 * calculate the startdate based on the enddate, if no enddate is given, enddate is Date.now()
 * @param interval
 * @param UTZEndDate
 * @returns {*}
 */
function getUTZStartDate(interval, UTZEndDate)
{

    let startdate = new Date();

    if (!UTZEndDate) {
        UTZEndDate = new Date();
    } else {
        UTZEndDate = new Date(UTZEndDate);
    }

    switch (interval) {
        case 'day':
            startdate = UTZEndDate.setDate(UTZEndDate.getDate() - 1);
            break;
        case 'week':
            startdate = UTZEndDate.setDate(UTZEndDate.getDate() - 7);
            break;
        case 'month':
            startdate = UTZEndDate.setDate(UTZEndDate.getDate() - 30);
            break;
        case 15:
            //for now we just use the same date as the enddate as the start date i.e. to get totals of this month
            //other option is to return UTZEndDate.setDate(UTZEndDate.getDate() - 30); (will respond in two objects)
            startdate = UTZEndDate;
            break;
        case 'year':
            startdate = UTZEndDate.setFullYear(UTZEndDate.getFullYear() - 1);
            break;
        case 17:
            startdate = UTZEndDate.setFullYear(UTZEndDate.getFullYear() - 1);
            break;
        case 'total':
            startdate = UTZEndDate.setFullYear(UTZEndDate.getFullYear() - 5);
        default:
            startdate = UTZEndDate;
            break;
    }

    return getCurrentDateTime(startdate);
}

/**
 * get UTZDate of today or a given date
 * @params {String} [date] - to set as endDate, by default today (undefined)
 * @returns {string}
 *
 */
function getUTZEndDate(date)
{
    return getCurrentDateTime(date);
}

/**
 * Get the currentDatetime
 * @param now - current date in millsecs
 * @param onlyDate do we want the date only or also time
 * @param plain do we want it as one string or seperated
 * @param sepMark
 * @param millsec
 * @returns {string}
 */
function getCurrentDateTime(now, onlyDate, plain, sepMark, millsec)
{
    if (now) {
        now = new Date(now);
    } else {
        now = new Date();
    }
    if (!sepMark) {
        sepMark = '/';
    }
    let month = (now.getMonth() + 1).toString();

    let day = now.getDate().toString();

    let year = now.getFullYear();

    let hours = now.getHours().toString();
    hours = (hours.length == 1) ? '0' + hours : hours;

    let minutes = now.getMinutes().toString();
    minutes = (minutes.length == 1) ? '0' + minutes : minutes;

    let seconds = now.getSeconds().toString();
    seconds = (seconds.length == 1) ? '0' + seconds : seconds;

    let milliseconds = now.getMilliseconds().toString();
    milliseconds = (milliseconds.length == 1) ? '0' + milliseconds : milliseconds;

    if (onlyDate) {
        if (plain) {
            return year + month + day;
        }
        return year + sepMark + month + sepMark + day;
    } else {

        if (millsec) {
            milliseconds = ' ' + milliseconds;
        } else {
            milliseconds = '';
        }

        if (plain) {
            return year + month + day + hours + minutes + seconds + milliseconds;
        }

        return year + sepMark + month + sepMark + day + ' ' + hours + ':' + minutes + ':' + seconds + milliseconds;
    }
}

/**
 * Get Chartdata (statistics) of the user's turbines to be displayed in ie. total overview
 * @param intervalId - string
 *
 */
Windmill.getUserChartDataById = function (intervalId) {
    //set headers.
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(intervalId);

    let actualInterval = getRealIntervalType(intervalId);

    if (this.intervalTypes[actualInterval]) {
        actualInterval = this.intervalTypes[actualInterval];
    }

    return getUserChartDataById(actualInterval);//manipulation will be done in calling controller.
};

/**
 * get the total prognosis (and production) for this month for all the turbines registered for the user
 * @returns {*}
 */
Windmill.getUserTotalsThisMonth = function(){
    window.axios.defaults.headers = store.state.headers;
    window.axios.defaults.headers.token = localStorage.token;

    //specific headers
    window.axios.defaults.headers.UTZEndDate = getUTZEndDate();
    window.axios.defaults.headers.UTZStartDate = getUTZStartDate(15);

    return getUserPrognosisById(15);
}


function getAssets()
{
    return axios.get('Session/Assets');
}

function getRealTime()
{
    return axios.get('Turbines/RealTime');
}

function getEnumeration(enumeration)
{
    return axios.get('Enumerations/' + enumeration);
}

function getParkTurbines(id)
{
    return axios.get('Groups/' + id + '/Turbines');
}

function getTurbine(id)
{
    return axios.get('Turbines');
}

function getTurbineRealTime(id)
{
    return axios.get('Turbines/' + id + '/RealTime');
}

function getParkRealTime(id)
{
    return axios.get('Groups/' + id + '/Turbines/RealTime');
}

function getParkWeather(id)
{
    return axios.get('Groups/' + id + '/Weather/Forecast');
}

function getParkChartDataById(id, intervalId)
{
    return axios.get('Groups/' + id + '/ChartData/' + intervalId);
}

function getTurbineWeather(id)
{
    return axios.get('Turbines/' + id + '/Weather/Forecast');
}

function getTurbineChartDataById(id, intervalId)
{
    return axios.get('Turbines/' + id + '/ChartData/' + intervalId);
}

function getPrognosisTurbineDefault(id)
{
    return axios.get('Turbines/' + id + '/prognosisDefaults');
}

function getPrognosisTurbineInterval(id, intervalId)
{
    return axios.get('Turbines/' + id + '/prognosis/interval/' + intervalId);
}

function getPrognosisParkInterval(id, intervalId)
{
    return axios.get('Groups/' + id + '/prognosis/interval/' + intervalId);
}

function getUserChartDataById(intervalId)
{
    return axios.get('Session/CurrentUser/ChartData/' + intervalId);
}

function getUserPrognosisById(intervalId)
{
    return axios.get('Session/CurrentUser/Prognosis/interval/' + intervalId);
}

export default Windmill;
