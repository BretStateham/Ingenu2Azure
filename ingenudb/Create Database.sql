if exists(select object_id from sys.objects where type='u' and name='IoTHubDevices')
  begin
    print 'Dropping existing dbo.IoTHubDevices table...'
    drop table dbo.IoTHubDevices;
  end
go
print 'Creating dbo.IoTHubDevices table...'
go
CREATE TABLE dbo.IoTHubDevices 
(
  deviceId nvarchar(128) NOT NULL
    CONSTRAINT PK_IoTHubDevices_deviceId 
    PRIMARY KEY CLUSTERED,
  primaryConnectionString nvarchar(512) NOT NULL  
)
go
select * from dbo.IoTHubDevices;
go
/*
To populate this table:

1. For each Intellect device, collect it's "NodeID".
1. Create a new device identity in the Azure IoT Hub device registry, and use the NodeID as the deviceId for the device identity
1. Retrieve the primary connection string for the new Azure IoT Hub device identity
1. Using the NodeId/deviceId and primary connection strings from above, insert a new record in the table.  

Sample Insert and Query:

insert into dbo.IoTHubDevices (deviceId,primaryConnectionString) VALUES (
  'paste your Intellect NodeID / Azure IoT Hub devicId here',
  'paste your Azure IoT Hub primary connection string here'
);
go
select * from dbo.IoTHubDevices;

*/
go
if exists(select object_id from sys.objects where type='u' and name='LastSDUs')
  begin
    print 'Dropping existing dbo.LastSDUs table...'
    drop table dbo.LastSDUs;
  end
go
print 'Creating dbo.LastSDUs table...'
go
CREATE TABLE dbo.LastSDUs 
(
  readerId nvarchar(128) NOT NULL
    CONSTRAINT PK_LastSDUs_readerId
    PRIMARY KEY CLUSTERED,
  lastSDU nvarchar(512) NOT NULL  
)
go
select * from dbo.LastSDUs;
go



