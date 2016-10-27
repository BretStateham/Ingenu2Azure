-- SELECT ALL messages 
-- FROM the iot hub and put them
-- INTO the sql database
SELECT
    deviceId,
    messageId,
    [timestamp] as [timestamp],
    temperature
INTO
    sqldb
FROM
    iothub

-- SELECT ONLY messages
-- WHERE the temperature is > 40
-- FROM the iot hub and put them 
-- INTO the alerts event hub
SELECT
    deviceId,
    messageId,
    [timestamp] as [timestamp],
    temperature
INTO
    alerts
FROM
    iothub
WHERE temperature > 40  