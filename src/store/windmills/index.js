// Generate an "initial" store state so you can efficiently reset the state to its initial state.
const initialState = {
    parks: [],
    turbines: [],
    parkTurbines: [],
    constants: {},
    currentPark: null,
    weather: {},
    showWarnings: false,
    statusColors: {
        1: '#50A8B4',//normal
        2: '#FF688B',//error
        3: '#8A42AE'  //no connection
    },
};

// Assign the initial state to the actual state;
const state = Object.assign({}, initialState);

const mutations = {
    // Resets the state to the initial state
    resetState(state)
    {
        for (let prop in state) {
            state[prop] = initialState[prop];
        }
    },

    setCurrentPark(state, id)
    {
        state.currentPark = id;
    },
    getStatusColors: (state) =>
    {
        return state.statusColors;
    },
    setEmpty(state)
    {
        state.parks = [];
        state.turbines = [];
        state.parkTurbines = [];

        state.weather = {};
    },
    setParks(state, windmills)
    {
        state.parks = windmills.parks;
        localStorage.setItem('windmills', JSON.stringify(state.parks));
    },
    setParkTurbines(state, parkTurbines)
    {
        state.parkTurbines = parkTurbines.parkTurbines;
        localStorage.setItem('parkTurbines', JSON.stringify(state.parkTurbines));
    },
    setWeatherLocations(state, weather)
    {
        let weatherLocations = weather.locations;
        let weatherData = weather.data;
        let totalWeather = {};

        weatherLocations.forEach((val) =>
        {
            val.Weather = [];
            totalWeather[val.ID] = val;
        });

        weatherData.forEach((subval) =>
        {
            totalWeather[subval.WeatherForecastLocationID].Weather.push(subval);
        });

        localStorage.weather = JSON.stringify(totalWeather);
        state.weather = totalWeather;
    },
    setTurbines(state, data)
    {

        // Set turbines. Include the "merge:true" parameter to merge the data when it already exists instead of overwriting it.
        let turbines = [];

        // Initially check for turbines in the localstorage. Always assume this is the "oldest" set of known data.
        if (localStorage.turbines) {
            turbines = JSON.parse(localStorage.turbines);
        }
        // If windmills / turbines are present in the store, use those as these are fetched and updated as a "session", rather than "database" data.
        if (state.turbines) {
            turbines = state.turbines;
        }
        // If the data set includes turbines and does *NOT* include the merge parameter, use the given data.turbines to set the localstorage/store
        if (data.turbines && data.merge !== true) {
            turbines = data.turbines;
        }

        // If the data does include the merge parameter, either overwrite single turbines or push new entries to the existing turbine array
        if (data.merge === true) {
            data.turbines.forEach((val, index) =>
            {
                let target = val.TurbineID;
                let turbine = _.findIndex(turbines, {'TurbineID': target});

                if (turbine != -1) {
                    // When the turbine with TurbineID {X} already exists, overwrite with new data and merge it to the existing array
                    turbines[turbine] = val;
                } else {
                    // Add a new turbine entry to existing array
                    turbines.push(val);
                }
                turbine = null;
            });
        }

        if (turbines.length === undefined) {
            // Safety check. If the turbines variable does not have a length, it isn't an array, but rather an empty object. Force it to be an array.
            turbines = [];
        }
        // If the data includes realtime data, merge it onto the known turbines.
        if (data.realtime) {
            data.realtime.RealTimeData.forEach((val, index) =>
            {


                let target = val.TurbineID;
                let turbine = _.findIndex(turbines, {'TurbineID': target});

                if (turbine != -1) {
                    turbines[turbine][val.DataTypeCode] = val.Value;
                    // Added a description field.
                    turbines[turbine][val.DataTypeCode + 'Description'] = val.ValueDescription;
                }

                turbine = null;
            });

            data.realtime.TurbineData.forEach((val, index) =>
            {


                let target = val.TurbineID;
                let turbine = _.findIndex(turbines, {'TurbineID': target});

                if (turbine != -1) {

                    turbines[turbine]['EngineerOnSite'] = val.EngineerOnSite;
                }
                turbine = null;
            });
        }

        // Push the turbines set to the localstorage and the store.

        localStorage.setItem('turbines', JSON.stringify(turbines));
        state.turbines = turbines;
    },
    setPark(state, data)
    {
        let parkIndex = getters.getParkIndex(state)(data.ParkID);
    },
    toggleWarnings(state)
    {
        state.showWarnings = !state.showWarnings;
    },
    setConstants(state, constants)
    {
        if (constants) {
            constants.forEach((c) =>
            {
                state.constants[c.Code] = {
                    value: c.Value,
                    raw: c,
                }
            });
            localStorage.setItem('constants', JSON.stringify(state.constants));
        }
    },
};

const getters = {
    getParks(state)
    {
        // Mutate parks so they contain all the turbines; Link the turbines to the park by using the parkTurbines (turbines could be in multiple parks, but only return a default ParkID in their own dataset);
        let turbines = [];
        let parks = [];
        let parkTurbines = [];

        if (state.turbines.length > 0 && state.parks.length > 0 && state.parkTurbines.length > 0) {
            turbines = state.turbines;
            parks = state.parks;
            parkTurbines = state.parkTurbines;
        } else {
            turbines = JSON.parse(localStorage.getItem('turbines'));
            parks = JSON.parse(localStorage.getItem('windmills'));
            parkTurbines = JSON.parse(localStorage.getItem('parkTurbines'));
        }

        return {turbines: turbines, parks: parks, parkTurbines: parkTurbines};
    },
    getWeatherByLocation: (state, getters, rootState, rootGetters) => (id) =>
    {
        let weatherToSearch;
        if (localStorage.weather) {
            weatherToSearch = JSON.parse(localStorage.weather);
        } else {
            weatherToSearch = state.weather;
        }
        if (Object.keys(weatherToSearch).length >= 1) {
            if (weatherToSearch[id]) {

                return weatherToSearch[id].Weather;
            }
        }
    },
    getTurbineById: (state, getters, rootState, rootGetters) => (id) =>
    {
        let turbines = [];
        if (localStorage.turbines) {
            turbines = JSON.parse(localStorage.turbines);
        } else {
            turbines = state.turbines;
        }

        let turbine = turbines.find(function (turbine)
        {
            return turbine.TurbineID == id;
        });

        if (turbine) {
            return turbine;
        }

        return false;
    },
    /**
     * get userdata by id.
     * @param {String|Number} id - the property we want to find the user by.
     */
    getParkById: (state, getters, rootState, rootGetters) => (id) =>
    {
        if (typeof id == 'string') {
            id = parseInt(id);
        }

        // Use park data, otherwise return empty array
        let turbines = [];
        let parks = [];
        let parkTurbines = [];

        if (state.turbines.length > 0 && state.parks.length > 0 && state.parkTurbines.length > 0) {
            turbines = state.turbines;
            parks = state.parks;
            parkTurbines = state.parkTurbines;
        } else {
            turbines = JSON.parse(localStorage.getItem('turbines'));
            parks = JSON.parse(localStorage.getItem('windmills'));
            parkTurbines = JSON.parse(localStorage.getItem('parkTurbines'));
        }

        if (parks.length > 0) {
            let park = parks.find(function (item)
            {
                return item.ID == id;
            });

            if (park) {
                park.Turbines = turbines;

                return {turbines: turbines, parks: [park], parkTurbines: parkTurbines};
            }
        }

        return false;
    },
    getParkIndex: (state, getters, rootState, rootGetters) => (id) =>
    {
        return _.findIndex(state.parks, {'ID': parseInt(id)});
    },
    getTurbines(state)
    {
        let turbines = [];
        if (state.turbines && state.turbines.length > 0) {
            turbines = state.turbines;
        } else {
            if (localStorage.getItem('turbines')) {
                turbines = JSON.parse(localStorage.getItem('turbines'));
            }
        }

        return turbines;
    },
    getTurbinesByQuery: (state, getters) => (query, limit = 10, offset = 0) =>
    {

        let turbines = [];
        if (state.turbines && state.turbines.length > 0) {
            turbines = state.turbines;
        } else {
            turbines = JSON.parse(localStorage.turbines);
        }
        //sort by displayname
        turbines = _.sortBy(turbines, (turbine) =>
        {
            return turbine.DisplayName;
        });

        //check if we have a query, if not we want to get all
        let turbinesResult = turbines;
        if (query) {
            turbinesResult = turbines.filter(function (item)
            {
                return item.DisplayName.toLowerCase().indexOf(query.toLowerCase()) !== -1;
            });

        }
        turbinesResult = turbinesResult.slice(offset, offset + limit);
        return {turbines: turbinesResult, offset: offset};

    },
    getWarningTurbines(state)
    {
        let turbines = [];
        let warningTurbines = [];


        if (state.turbines && state.turbines.length > 0) {
            turbines = state.turbines;
        } else {
            if (localStorage.getItem('turbines')) {
                turbines = JSON.parse(localStorage.getItem('turbines'));
            }
        }

        // Filter out all windmills that have the following statuses; (status 2 = OK)
        _.each(turbines, (val, idx) =>
        {
            if ((state.currentPark == null || val.ParkID == state.currentPark) && (val.AppTurbineStatus !== undefined && val.AppTurbineStatus != 2)) {
                warningTurbines.push(val);
            }
        });

        warningTurbines = _.sortBy(warningTurbines, (turbine) =>
        {
            return turbine.DisplayName;
        });

        return warningTurbines;
    },
    getParkNameById: (state, getters) => (id) =>
    {
        let parks = [];
        if (localStorage.windmills) {
            parks = JSON.parse(localStorage.windmills);
        } else {
            parks = state.parks;
        }

        if (typeof id == 'string') {
            id = parseInt(id);
        }

        if (parks.length >= 1) {
            let park = parks.find((park) =>
            {
                return park.ID == id;
            });

            if (park) {
                return park;
            }
        }
        return false;
    },

    getConstants(state)
    {
        let localConstants = localStorage.getItem('constants');

        if (localConstants != null) {
            return JSON.parse(localConstants);
        }
        return state.constants;
    },
    getCo2Factor(state, getters)
    {

        let constants = getters['getConstants'];

        if (constants) {
            if (constants['kWh2CO2reductionFactor']) {
                return constants['kWh2CO2reductionFactor'].value;

            }
        }

        return false;
    },

};

const Windmill = {
    namespaced: true,
    state,
    mutations,
    getters,
};

export default Windmill;
