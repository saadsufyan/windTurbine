/**
 * Holds some default configuration
 */

export default {

    statusID: [
        {
            "ID": 0,
            "DisplayName": "Geen verbinding",
            "ShowTurbineRotation": false,
            "DisplayStatus": "WARNING"
        }, {
            "ID": 1,
            "DisplayName": "Inactief",
            "ShowTurbineRotation": false,
            "DisplayStatus": "WARNING"
        }, {
            "ID": 2,
            "DisplayName": "Actief",
            "ShowTurbineRotation": true,
            "DisplayStatus": "OK"
        }, {
            "ID": 3,
            "DisplayName": "Storing",
            "ShowTurbineRotation": false,
            "DisplayStatus": "ERROR"
        }, {
            "ID": 4,
            "DisplayName": "Software onderhoud",
            "ShowTurbineRotation": true,
            "DisplayStatus": "WARNING"
        }, {
            "ID": -1,
            "DisplayName": "Nog niet bepaald",
            "ShowTurbineRotation": false,
            "DisplayStatus": "WARNING"
        }
    ],

    numeral: {
        nl: {
            delimiters: {
                thousands: '.',
                decimal: ','
            },
            abbreviations: {
                thousands: 'k',
                million: 'mln',
                billion: 'mrd',
                trillion: 'bln'
            },
            ordinal: (number) => {
                let remainder = number % 100;
                return (number !== 0 && remainder <= 1 || remainder === 8 || remainder >= 20) ? 'ste' : 'de';
            },
            currency: {
                symbol: '€ '
            }
        },
        en:{
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
        }
    }
};