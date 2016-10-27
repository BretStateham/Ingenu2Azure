
--insert into dbo.IoTHubDevices (deviceId,primaryConnectionString) VALUES (
--  '0x00072d97',
--  'HostName=ingenuhub.azure-devices.net;DeviceId=0x00072d97;SharedAccessKey=GudARTyUki/c2JB3VU8HT88+7Y2i6Jn4PIf3hD6fU5g='
--);
--go
--select * from dbo.IoTHubDevices;
--go
--insert into dbo.lastSDUs(readerId,lastSDU) VALUES 
--( 'IntellectRest2IoTHubJs','47fa7ad0-9bc1-11e6-b09a-4fcab088c061');
--go
--select * from dbo.lastSDUs;
--go

select * from dbo.IoTHubDevices;
select * from dbo.lastSDUs;

/*
UPDATE dbo.lastSDUs
SET lastSDU = '5c0e73e0-9bd1-11e6-b09a-4fcab088c061'
WHERE readerId = 'IntellectRest2IoTHubJs';
*/




--5c0e73e0-9bd1-11e6-b09a-4fcab088c061
--5c0e73e0-9bd1-11e6-b09a-4fcab088c061
--5c0e73e0-9bd1-11e6-b09a-4fcab088c061
--5c0e73e0-9bd1-11e6-b09a-4fcab088c061
--7ffd36b0-9bd1-11e6-b09a-4fcab088c061
--9365c7d0-9bd1-11e6-b09a-4fcab088c061
