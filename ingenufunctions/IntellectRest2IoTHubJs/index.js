// ======================================================================
// IntellectRest2IoTHubJs
// 
// This function retrieves Uplink Messages from the Intellect RestAPI
// Then generates new messages and submits them to Azure IoT Hub
// ======================================================================

// ----------------------------------------------------------------------
// Requires
// ----------------------------------------------------------------------

/** tedious is used to connect to the Azure SQL Database: 
  GitHub: https://github.com/tediousjs/tedious
  NPM:    https://www.npmjs.com/package/tedious
*/
var Connection = require('tedious').Connection;

// ----------------------------------------------------------------------
// Module level declarations
// ----------------------------------------------------------------------

/** sqlConfig stores the SQL Database Connection Details 
  TODO: Move username and password info out into secure config
*/
var sqlConfig = {
    userName: GetEnvironmentVariable("SqlLogin"),
    password: GetEnvironmentVariable("SqlPassword"),
    server: GetEnvironmentVariable("SqlServer"),
    options: { encrypt: true, database: GetEnvironmentVariable("SqlDb") }
};

// ----------------------------------------------------------------------
// Functions
// ----------------------------------------------------------------------

/** Retrieve's an Azure IoT Hub Device Connection String from the SQL Database assuming it exists.  ' */
function getDeviceConnectionStringFromSQL(deviceId) {
    var result = runQuery("SELECT primaryConnectionString from dbo.IoTHubDevices WHERE deviceId = " + deviceId);
    console.log("Result: ");
    console.log(result);
    return result;
}

function runQuery(query) {
    var result = {};

    var connection = new Connection(sqlConfig);
    connection.on('connect', function (err) {

        if (err) {
            console.error("There was an error connecting to the database: " + err);
            result.error = err;
            return result;
        }
        // If no error, then good to proceed.  
        console.log("Connected to sql database");

        var sqlRequest = new Request(query,
            function (err) {
                if (err) {
                    console.log('An error occurred when executing the sql request:\n' + err);
                    result.error = err;
                    return result;
                }
            });

        sqlRequest.on('doneInProc', function (rowCount, more, rows) {
            result.rows = rows;
            // console.log('doneInProc: ' + rowCount + ' rows returned');
            // console.log(rows.length);
            // rows.forEach(function (row) {
            //     row.forEach(function (column) {
            //         if (column.value === null) {
            //             console.log('NULL');
            //         } else {
            //             result += column.value + " ";
            //         }
            //     });
            //     console.log(result);
            //     result = "";
            // });
            connection.close();
            return result;
        });

        connection.execSql(sqlRequest);

    });

}

/** Retrieve an Environment Variable */
function GetEnvironmentVariable(name) {
    return process.env[name];
}


// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
module.exports = function (context, timerTrigger) {

    var timeStamp = new Date().toISOString();

    if (timerTrigger.isPastDue) {
        context.log('Node.js is running late!');
    }

    var sqlServer = GetEnvironmentVariable("SqlServer");
    context.log("SqlServer Environment Variable: " + sqlServer);
    context.log("sqlConfig:");
    context.log(JSON.stringify(sqlConfig));

    context.log("Retrieving device connection string:");
    getDeviceConnectionStringFromSQL(deviceId)

    context.log('Node.js timer trigger function ran!', timeStamp);

    context.done();
};

