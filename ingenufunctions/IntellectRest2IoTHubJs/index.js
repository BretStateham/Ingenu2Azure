// ======================================================================
// IntellectRest2IoTHubJs
// 
// This function retrieves Uplink Messages from the Intellect RestAPI
// Then generates new messages and submits them to Azure IoT Hub
// ======================================================================

// ----------------------------------------------------------------------
// Requires
// ----------------------------------------------------------------------
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
    userName: GetEnvironmentVariable("SqlLogin"),  
    password: GetEnvironmentVariable("SqlPassword"),  
    server: GetEnvironmentVariable("SqlServer"),
    options: {encrypt: true, database: GetEnvironmentVariable("SqlDb")}
};

// ----------------------------------------------------------------------
// Functions
// ----------------------------------------------------------------------
/** Retrieve's an Azure IoT Hub Device Connection String from the SQL Database assuming it exists.  ' */
function getDeviceConnectionStringFromSQL(deviceId){

}

/** Retrieve an Environment Variable */
function GetEnvironmentVariable(name)
{
    return process.env[name];
}


// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
module.exports = function (context, timerTrigger) {
    
    var timeStamp = new Date().toISOString();
    
    if(timerTrigger.isPastDue)
    {
        context.log('Node.js is running late!');
    }
    
    var sqlServer = GetEnvironmentVariable("SqlServer");
    context.log("SqlServer Environment Variable: " + sqlServer);
    context.log("sqlConfig:");
    context.log(JSON.stringify(sqlConfig));

    context.log('Node.js timer trigger function ran!', timeStamp);   
    
    context.done();
};

