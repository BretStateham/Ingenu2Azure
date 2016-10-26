var https = require('https');
var fs = require('fs');
var configPath = "./config.json";
var config;

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

//var lastSdu = "136c6470-9ace-11e6-b09a-4fcab088c061";
//var lastSdu = "ea501680-9ac9-11e6-b09a-4fcab088c061";
//var lastSdu = "";

function getConfig(){
    var configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log("lastSdu: " + config.lastSdu);
}

function saveConfig(){
    fs.writeFileSync(configPath,JSON.stringify(config),{encoding: 'utf8'});
}

function getNextSdu(callback) {
    var path = "/data/v1/receive/" + config.lastSdu + "?count=1";
    var headers = {
        Username: config.userName,
        Password: config.password,
        Accept: 'application/json'
    }
    var options = {
        host: config.host,
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
            callback(data);
        })
    });

    req.on('error', function (e) {
        console.error(e);
    })

    req.end();
}


function processData(data){
    var result = JSON.parse(data);
    var uplinks = result.uplinks;
    for(var u = 0; u < uplinks.length; u++){
        uplink = uplinks[u];
        config.lastSdu = uplink.messageId;
        saveConfig();
        if(uplink.messageType == "DatagramUplinkEvent"){
            var payload = parsePayload(uplink.datagramUplinkEvent.payload);
            uplink.parsedPayload = payload;
            console.log('\nMessage With Payload:\n' + JSON.stringify(uplink));
        } else if(uplink.messageType == "DatagramDownlinkResponse"){
            console.log('\nDownlink Message\n' + JSON.stringify(uplink));
        }
    }
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
            console.log("\n!!!!!!!!!! - Alarm message received\n")
            break;
        case "07": //Serial
            console.log("\n!!!!!!!!!! - Serial message received\n")
            var bodyhex = payloadhex.substr(8,payloadhex.length-(startpos+trimlen));
            var bodytext = hex2a(bodyhex);
            var sensorValues = bodytext.split('_');
            result.bodyHex = bodyhex;
            result.bodyText = bodytext;
            result.sensors = sensorValues;
            break;
        default: //Unknown
            console.log("\n!!!!!!!!!! - Unknown message received\n")
            break;
    }
    
    // console.log("hex:  " + hex);
    // console.log("type: " + msgtype);
    // console.log("body: " + bodyhex);
    // console.log("text: " + bodytext);

    // for(var i = 0; i < sensorvalues.length; i++){
    //     console.log("  Sensor Value: " + parseFloat(sensorvalues[i]));
    // }

    return result;

}

/// ==================================================
/// Main
/// ==================================================

getConfig();
setInterval(function(){
    getNextSdu(processData);
}, 1000);
