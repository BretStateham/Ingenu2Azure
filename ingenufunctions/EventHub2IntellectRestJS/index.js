'use strict';
// ======================================================================
// EventHub2IntellectRestJS
// 
// This function listens for messages on the ingenualerts event hub
// and send alerts to the rACM via the Intellect Rest API
// ======================================================================

// ----------------------------------------------------------------------
// Requires
// ----------------------------------------------------------------------

/** https is used to access the Intellect REST API */
var https = require('https');

/** node-uuid is used to generate unique tags to send to the rACM */
var uuid = require('node-uuid');

// ----------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------

/** Retrieve an Environment Variable */
function GetEnvironmentVariable(name) {
    return process.env[name];
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
module.exports = function (context, myEventHubTrigger) {
    context.log('Node.js eventhub trigger function processed work item', myEventHubTrigger);

    var nodeid = myEventHubTrigger ?  myEventHubTrigger.deviceid : "0x00072d97";
    var tagid = myEventHubTrigger ? myEventHubTrigger.messageid : uuid.v4();

    var post_data = "<downlink xmlns='http://www.ingenu.com/data/v1/schema'><datagramDownlinkRequest><tag>" + tagid + "</tag><nodeId>" + nodeid + "</nodeId><payload>0301870010</payload></datagramDownlinkRequest></downlink>";
    context.log("Sending\n" + post_data);

    var path = "/data/v1/send";
    var headers = {
        Username: GetEnvironmentVariable("IntellectUsername"),
        Password: GetEnvironmentVariable("IntellectPassword"),
        "Content-type": 'application/xml'
    }
    var options = {
        host: GetEnvironmentVariable("IntellectHost"),
        port: 443,
        path: path,
        method: "POST",
        headers: headers
    };

    var data = '';

    var req = https.request(options, function (res) {
        res.on('data', function (d) {
            data += d;
            context.log("data: " + data);
        });

        res.on('end', function () {
            //callback(JSON.parse(data));
            context.log("Response ended.");
        })
    });

    req.on('error', function (e) {
        context.log("https request error: " + e);
    })

    
    req.write(post_data);
    req.end();

    context.done();
};