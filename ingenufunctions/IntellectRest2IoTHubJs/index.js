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
function getDeviceConnectionStringFromSQL(deviceId, callback) {
    var query = "SELECT primaryConnectionString from dbo.IoTHubDevices WHERE deviceId = @deviceId";
    var sqlRequest = new Request(query,
        function (err) {
            if (err) {
                context.log('An error occurred when executing the sql request:\n' + err);
                result.error = err;
                return result;
            }
        });
    sqlRequest.addParameter("deviceId", TYPES.NVarChar, deviceId)
    executeRequest(sqlRequest, function (err, rowCount, rows) {
        if (err) {
            context.log('There was an error retrieving the IoT Hub Device ID:\n' + err);
            return null;
        }
        var primaryConnectionString = rows[0][0].value;
        context.log("primaryConnectionString: " + primaryConnectionString);
        sqlRequest = null;
        callback(primaryConnectionString);
    });
}

/** Retrieve's an Azure IoT Hub Device Connection String from the SQL Database assuming it exists.  ' */
function getLastSDU(readerId, callback) {
    var query = "SELECT lastSDU from dbo.lastSDUs WHERE readerId = @readerId";
    var sqlRequest = new Request(query,
        function (err) {
            if (err) {
                context.log('An error occurred when executing the sql request:\n' + err);
                result.error = err;
                return result;
            }
        });
    sqlRequest.addParameter("readerId", TYPES.NVarChar, readerId)
    executeRequest(sqlRequest, function (err, rowCount, rows) {
        if (err) {
            context.log('There was an error retrieving the last SDU:\n' + err);
            return null;
        }
        var lastSDU = rows[0][0].value;
        context.log("lastSDU: " + lastSDU);
        sqlRequest = null;
        callback(lastSDU);
    });
}

/** Retrieve's an Azure IoT Hub Device Connection String from the SQL Database assuming it exists.  ' */
function saveLastSDU(readerId, lastSDU, callback) {
    var query = "INSERT INTO lastSDUs (readerId,lastSDU) VALUES (@readerId,@lastSDU)";
    var sqlRequest = new Request(query,
        function (err) {
            if (err) {
                context.log('An error occurred when executing the sql request:\n' + err);
                result.error = err;
                return result;
            }
        });
    sqlRequest.addParameter("readerId", TYPES.NVarChar, readerId);
    sqlRequest.addParameter("lastSDU", TYPES.NVarChar, lastSDU);
    executeRequest(sqlRequest, function (err, rowCount, rows) {
        if (err) {
            context.log('There was an error saving the last SDU:\n' + err);
            return null;
        }
        //var lastSDU = rows[0][0].value;
        context.log("saveLastSDU rows: " + rows);
        sqlRequest = null;
        callback(err);
    });
}


function executeRequest(sqlRequest, callback) {
    //var result = {};

    var connection = new Connection(sqlConfig);
    connection.on('connect', function (err) {

        if (err) {
            context.log("There was an error connecting to the database: " + err);
            callback(err, null, null);
        }
        // If no error, then good to proceed.  
        context.log("Connected to sql database");

        sqlRequest.on('doneInProc', function (rowCount, more, rows) {
            connection.close();
            callback(null, rowCount, rows);
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

function getNextUplinks(lastSDU, count, callback) {
    uplinks = {
        uplinks: [
            {
                messageId: "123",
                messageType: "DatagramUplinkEvent",
                datagramUplinkEvent: {
                    nodeId: "0x00072d97",
                    applicationId: 24,
                    timestamp: 1477518016135,
                    payload: "Bw0ACjc4LjgwXzE4LjAwAA=="
                }
            }
        ]
    };
    var result = (uplinks.uplinks) ? uplinks.uplinks : null;
    callback(result);
}


// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
module.exports = function (ctx, timerTrigger) {

    //store function's context in module level variable.
    context = ctx;
    var readerId = "IntellectRest2IoTHubJs";

    var timeStamp = new Date().toISOString();

    if (timerTrigger.isPastDue) {
        context.log('Node.js is running late!');
    }

    getLastSDU(readerId, function (lastSDU) {
        getNextUplinks(lastSDU, 1, function (uplinks) {
            context.log("lastSDU: " + lastSDU);
            for(var u = 0; u < uplinks.length; u++){

                var uplink = uplinks[u];
                context.log("messageType: " + uplink.messageType);

                if(uplink.messageType == "DatagramUplinkEvent"){

                    var datagramUplinkEvent = uplink.datagramUplinkEvent;

                    context.log("nodeId: " + datagramUplinkEvent.nodeId);
                    context.log("payload: " + datagramUplinkEvent.payload );
                    var deviceId = datagramUplinkEvent.nodeId;

                    getDeviceConnectionStringFromSQL(deviceId, function (iotHubConString) {
                        context.log("iotHubConString: " + iotHubConString);
                    });
                }
            }

            saveLastSDU(readerId,lastSDU,function(err){
                if(err){
                    context.log('There was an issue saving the lastSDU back to the database');
                }
                context.log('Saved lastSDU');
            });
        });
    });

    context.log('Node.js timer trigger function ran!', timeStamp);

    context.done();
};

