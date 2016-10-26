// ======================================================================
// IntellectRest2IoTHubJs
// 
// This function retrieves Uplink Messages from the Intellect RestAPI
// Then generates new messages and submits them to Azure IoT Hub
// ======================================================================

// ----------------------------------------------------------------------
// Requires
// ----------------------------------------------------------------------
// nconf is used to load configuration values from the 
// command line args, environment variables, or config file
// GitHub: https://github.com/indexzero/nconf
// NPM:    https://www.npmjs.com/package/nconf 
var nconf = require('nconf');

// Tedious is used to connect to the Azure SQL Database: 
// GitHub: https://github.com/tediousjs/tedious
// NPM:    https://www.npmjs.com/package/tedious
var Connection = require('tedious').Connection; 

// ----------------------------------------------------------------------
// Module level declarations
// ----------------------------------------------------------------------
// sqlConfig stores the SQL Database Connection Details
// TODO: Move username and password info out into secure config 
var sqlConfig = {
    server: nconf.get("SqlServer"),
    options: {encrypt: true, database: 'ingenudb'}
};

/** Retrieve's an Azure IoT Hub Device Connection String from the SQL Database assuming it exists.  ' */
function getDeviceConnectionStringFromSQL(deviceId){

}


module.exports = function (context, timerTrigger) {
    
    var timeStamp = new Date().toISOString();
    
    if(timerTrigger.isPastDue)
    {
        context.log('Node.js is running late!');
    }
    context.log("sqlConfig:");
    context.log(JSON.stringify(sqlConfig));

    context.log('Node.js timer trigger function ran!', timeStamp);   
    
    context.done();
};

