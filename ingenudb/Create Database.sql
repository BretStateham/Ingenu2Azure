if exists(select object_id from sys.objects where type='u' and name='IoTDevices')
  begin
    print 'Dropping existing dbo.IoTDevices table...'
    drop table dbo.IoTDevices;
  end
go
print 'Creating dbo.IoTDevices table...'
go
CREATE TABLE dbo.IoTDevices 
(
  deviceId nvarchar(128) NOT NULL
    CONSTRAINT PK_IoTDevices_deviceId 
    PRIMARY KEY CLUSTERED,
  primaryConnectionString nvarchar(512) NOT NULL  
)
go
select * from dbo.IoTDevices;
go
/*
To populate this table:

1. For each Intellect device, collect it's "NodeID".
1. Create a new device identity in the Azure IoT Hub device registry, and use the NodeID as the deviceId for the device identity
1. Retrieve the primary connection string for the new Azure IoT Hub device identity
1. Using the NodeId/deviceId and primary connection strings from above, insert a new record in the table.  

Sample Insert:

insert into dbo.IoTDevices (deviceId,primaryConnectionString) VALUES (
  'paste your Intellect NodeID / Azure IoT Hub devicId here',
  'paste your Azure IoT Hub primary connection string here'
);

*/

