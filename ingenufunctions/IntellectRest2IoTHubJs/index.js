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
var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;

// ----------------------------------------------------------------------
// Module level declarations
// ----------------------------------------------------------------------

var context;  //This will be a reference to the function's context


/** sqlConfig stores the SQL Database Connection Details */
var sqlConfig = {
    userName: GetEnvironmentVariable("SqlLogin"),
    password: GetEnvironmentVariable("SqlPassword"),
    server: GetEnvironmentVariable("SqlServer"),
    options: { 
        encrypt: true,
        rowCollectionOnDone: true, 
        database: GetEnvironmentVariable("SqlDb") 
    }
};

// ----------------------------------------------------------------------
// Functions
// ----------------------------------------------------------------------

/** Retrieve's an Azure IoT Hub Device Connection String from the SQL Database assuming it exists.  ' */
function getDeviceConnectionStringFromSQL(deviceId) {
    // var query = "SELECT primaryConnectionString from dbo.IoTHubDevices WHERE deviceId = '" + deviceId + "'";
    // var result = runQuery(query);
    // context.log("Result: ");
    // context.log(result);
    // return result;

    var query = "SELECT primaryConnectionString from dbo.IoTHubDevices WHERE deviceId = @deviceId";
    var sqlRequest = new Request(query,
        function (err) {
            if (err) {
                context.log('An error occurred when executing the sql request:\n' + err);
                result.error = err;
                return result;
            }
        });
    sqlRequest.addParameter("deviceId",TYPES.NVarChar,deviceId)
    executeRequest(sqlRequest,function(err,rowCount,rows){
        if(err){
            context.log('There was an error retrieving the IoT Hub Device ID:\n' + err);
            return null;
        }
        context.log("Rows 2: ");
        context.log(rows);  
        var primaryConnectionString = rows[0][0].value;
        context.log("Primary Connection String:\n"+ primaryConnectionString);
        sqlRequest = null;
        return rows;
    });

    
}

function executeRequest(sqlRequest,callback) {
    //var result = {};

    var connection = new Connection(sqlConfig);
    connection.on('connect', function (err) {

        if (err) {
            context.log("There was an error connecting to the database: " + err);
            result.error = err;
            callback(err,null,null);
        }
        // If no error, then good to proceed.  
        context.log("Connected to sql database");

        sqlRequest.on('doneInProc', function (rowCount, more, rows) {
            context.log("rowCount: " + rowCount);
            context.log("rows:\n" + JSON.stringify(rows));
            //result.rows = rows;
            context.log("Rows 1: ");
            context.log(rows);   
            connection.close();
            callback(null,rowCount,rows);
        });

        connection.execSql(sqlRequest);

    });
}

function runQuery(query) {
    var result = {};

    context.log("Running query:");
    context.log(query);

    var connection = new Connection(sqlConfig);
    connection.on('connect', function (err) {

        if (err) {
            context.log("There was an error connecting to the database: " + err);
            result.error = err;
            return result;
        }
        // If no error, then good to proceed.  
        context.log("Connected to sql database");

        var sqlRequest = new Request(query,
            function (err) {
                if (err) {
                    context.log('An error occurred when executing the sql request:\n' + err);
                    result.error = err;
                    return result;
                }
            });

        sqlRequest.on('doneInProc', function (rowCount, more, rows) {
            result.rows = rows;
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
module.exports = function (ctx, timerTrigger) {

    //store function's context in module level variable.
    context = ctx;

    var timeStamp = new Date().toISOString();

    if (timerTrigger.isPastDue) {
        context.log('Node.js is running late!');
    }

    var sqlServer = GetEnvironmentVariable("SqlServer");
    context.log("SqlServer Environment Variable: " + sqlServer);
    context.log("sqlConfig:");
    context.log(JSON.stringify(sqlConfig));

    context.log("Retrieving device connection string:");
    var iotHubConString = getDeviceConnectionStringFromSQL("0x00072d97")
    context.log("IoT Hub Device Connection String:\n" + iotHubConString);

    context.log('Node.js timer trigger function ran!', timeStamp);

    context.done();
};

