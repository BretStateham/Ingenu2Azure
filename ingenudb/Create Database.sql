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
  lastSDU nvarchar(512) NOT NULL,
  lastModified timestamp NOT NULL
)
go
select * from dbo.LastSDUs;
go
-- Drop the dbo.Measurement table if it exists 
if exists(select object_id from sys.objects where type='U' and name = 'Measurement')
  drop table dbo.measurement;
go
-- Create the dbo.Measurement TABLE
-- this will store all the measurements received from iot hub
create table dbo.Measurement
(
    MeasurementID int IDENTITY(1,1) not null
      constraint PK_Measurement_MeasurementID 
      primary key CLUSTERED,
    deviceId nvarchar(50) not null
      constraint DF_Measurement_deviceId
      default '',
    messageId nvarchar(512) not null
      constraint DF_Measurement_messageId
      default '',
    [timestamp] datetime  null,
    temperature float(53) 
);
go
-- Query the table to ensure it EXISTS
-- the table was just created so there shouldn't
-- be any rows in it
select * from dbo.Measurement;
go
-- Drop the dbo.RecentMeasurements view if it exists 
if exists(select object_id from sys.objects where type='V' and name = 'RecentMeasurements')
  drop view dbo.RecentMeasurements;
go
-- Create the dbo.RecentMeasurements view
-- this return all recent (last 20) readings
create view dbo.RecentMeasurements as
select top 20
  deviceid,
  messageid,
  [timestamp],
  temperature 
from dbo.Measurement 
order by [timestamp] desc;
go
-- Query the view to make sure it works
select * from dbo.RecentMeasurements;
go
-- Drop the dbo.Devices view if it exists 
if exists(select object_id from sys.objects where type='V' and name = 'Devices')
  drop view dbo.Devices;
go
-- Create the dbo.Devices view
-- this return just the last measurement for each device
create view dbo.Devices as
with devices as
(
     select *,
         ROW_NUMBER() OVER
         (
             partition by deviceid
             order by [timestamp] desc
         ) as recency
     from dbo.Measurement
)
select 
    deviceid,
    messageid,
    [timestamp],
    temperature
from devices
where Recency = 1
go
-- Query the view to make sure it works
select * from dbo.Devices;
go



