'use strict';
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

/** https is used to access the Intellect REST API */
var https = require('https');

/** azure-iot requires  */
var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

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
    context.log(readerId + " is saving the lastSDU: " + lastSDU);
    var query = "UPDATE dbo.lastSDUs SET lastSDU = @lastSDU WHERE readerId = @readerId;"
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


/** Retrieve an Environment Variable */
function GetEnvironmentVariable(name) {
    return process.env[name];
}

function getNextUplinks(lastSDU, count, callback) {
    count = count ? count : 1;
    var path = "/data/v1/receive/" + lastSDU + "?count=" + count;
    var headers = {
        Username: GetEnvironmentVariable("IntellectUsername"),
        Password: GetEnvironmentVariable("IntellectPassword"),
        Accept: 'application/json'
    }
    var options = {
        host: GetEnvironmentVariable("IntellectHost"),
        port: 443,
        path: path,
        method: "GET",
        headers: headers
    };

    var data = '';

    var req = https.request(options, function (res) {
        res.on('data', function (d) {
            data += d;
        });

        res.on('end', function () {
            callback(JSON.parse(data));
        })
    });

    req.on('error', function (e) {
        console.error(e);
    })

    req.end();
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function parsePayload(payload){

// //var payload = "Bw0ACjc1LjIwXzE5LjAwAA==";
    var result = {};

    var payloadhex = Buffer.from(payload,'base64').toString('hex');

    var startpos = 8;
    var trimlen = 2;
    var msgtype = payloadhex.substr(0,2);
    result.type = msgtype;
    switch(msgtype){
        case "08": //Alarm
            context.log("\n!!!!!!!!!! - Alarm message received\n")
            //Not going to bother parsing the alarm data at this time.
            break;
        case "07": //Serial
            context.log("\n!!!!!!!!!! - Serial message received\n")
            //extract the sensor values from the string.  
            //Not a great practice, but I'm assuming the first one is temperature in Farenheit
            //And the second one is Relative Humidity %
            var bodyhex = payloadhex.substr(8,payloadhex.length-(startpos+trimlen));
            var bodytext = hex2a(bodyhex);
            var sensors = bodytext.split('_');
            result.bodyHex = bodyhex;
            result.bodyText = bodytext;
            result.temperature = parseFloat(sensors[0]);
            result.humidity = parseFloat(sensors[1])
            break;
        default: //Unknown
            context.log("\n!!!!!!!!!! - Unknown message received\n")
            break;
    }
    
    return result;

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

        getNextUplinks(lastSDU, 1, function (data) {

            context.log("Data Retrieved: ");
            context.log(JSON.stringify(data));

            context.log("Uplinks:");
            context.log(JSON.stringify(data.uplinks));
            
            context.log("lastSDU: " + lastSDU);
            var uplinks = data.uplinks ? data.uplinks : null;

            if(uplinks){

                for(var u = 0; u < uplinks.length; u++){

                    var uplink = uplinks[u];
                    context.log("messageType: " + uplink.messageType);
                    if(uplink){
                        // Get the messageId, and save it as the lastSDU processed.
                        // Really, I shouldn't do this until I know I've processed it, but
                        // putting it here makes sure it gets done, even if it means 
                        // failed messages don't get re-processed...
                        lastSDU = uplink.messageId;
                        saveLastSDU(readerId,lastSDU,function(err){
                            if(err){
                                context.log('There was an issue saving the lastSDU back to the database');
                            }
                            context.log('Saved lastSDU');
                        });


                        if(uplink.messageType == "DatagramUplinkEvent"){

                            var datagramUplinkEvent = uplink.datagramUplinkEvent;

                            if(datagramUplinkEvent){

                                var timestamp = datagramUplinkEvent.timestamp;
                                var timestampDate = new Date(timestamp);
                                context.log("timestamp: " + timestamp);
                                context.log("timestampDate: " + timestampDate);

                                context.log("nodeId: " + datagramUplinkEvent.nodeId);
                                context.log("payload: " + datagramUplinkEvent.payload );
                                var deviceId = datagramUplinkEvent.nodeId;

                                var payload = parsePayload(datagramUplinkEvent.payload);
                                context.log("payload: " + JSON.stringify(payload));

                                getDeviceConnectionStringFromSQL(deviceId, function (iotHubConString) {
                                    context.log("iotHubConString: " + iotHubConString);
                                    
                                    var iotHubClient = clientFromConnectionString(iotHubConString);

                                    iotHubClient.open(function(err){
                                        if (err) {
                                            context.log('Could not connect to IoT Hub: ' + err);
                                        } else {
                                            context.log('Connected to IoT Hub');

                                            //var windSpeed = 10 + (Math.random() * 4);
                                            //var data = JSON.stringify({ deviceId: 'myFirstNodeDevice', windSpeed: windSpeed });
                                            //var message = new Message(data);

                                            var msgpaylod = {
                                                deviceId: deviceId,
                                                timestamp: timestampDate.toISOString(),
                                                temperature: payload.temperature
                                            };

                                            var message = new Message(JSON.stringify(msgpaylod));

                                            console.log("Sending message: " + message.getData());
                                            iotHubClient.sendEvent(message, function(err,res){
                                                if (err) context.log('IoT Hub send error: ' + err.toString());
                                                if (res) context.log('IoT Hub send status: ' + res.constructor.name);
                                            });
                                        }
                                    });

                                });
                                
                            }


                        }
                    }
                }
            }
        });
    });

    context.log('Node.js timer trigger function ran!', timeStamp);

    context.done();
};

