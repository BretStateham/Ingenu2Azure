// DHT Temperature & Humidity Sensor
// Unified Sensor Library Example
// Written by Tony DiCola for Adafruit Industries
// Released under an MIT license.

// Depends on the following Arduino libraries:
// - Adafruit Unified Sensor Library: https://github.com/adafruit/Adafruit_Sensor
// - DHT Sensor Library: https://github.com/adafruit/DHT-sensor-library

#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <SoftwareSerial.h>

#define DHTPIN            6         // Pin which is connected to the DHT sensor.
#define LEDPIN           13         // Used to indicate when data is being sent

// Uncomment the type of sensor in use:
#define DHTTYPE           DHT11     // DHT 11 
//#define DHTTYPE           DHT22     // DHT 22 (AM2302)
//#define DHTTYPE           DHT21     // DHT 21 (AM2301)

// See guide for details on sensor wiring and usage:
//   https://learn.adafruit.com/dht/overview

DHT_Unified dht(DHTPIN, DHTTYPE);

uint32_t delayMS;
unsigned long lastMS;
unsigned long currentMS;


SoftwareSerial serial2(10, 11); // Define which digital pins we'll use for serial and give them a name

double Fahrenheit(double celsius)
{
return 1.8 * celsius + 32;
}

void setup() {
  Serial.begin(9600); 
  serial2.begin(9600);
  // Initialize device.
  dht.begin();
  Serial.println("DHTxx Unified Sensor Example");
  // Print temperature sensor details.
  sensor_t sensor;
  dht.temperature().getSensor(&sensor);
  Serial.println("------------------------------------");
  Serial.println("Temperature");
  Serial.print  ("Sensor:       "); Serial.println(sensor.name);
  Serial.print  ("Driver Ver:   "); Serial.println(sensor.version);
  Serial.print  ("Unique ID:    "); Serial.println(sensor.sensor_id);
  Serial.print  ("Max Value:    "); Serial.print(sensor.max_value); Serial.println(" *C");
  Serial.print  ("Min Value:    "); Serial.print(sensor.min_value); Serial.println(" *C");
  Serial.print  ("Resolution:   "); Serial.print(sensor.resolution); Serial.println(" *C");  
  Serial.println("------------------------------------");
  // Print humidity sensor details.
  dht.humidity().getSensor(&sensor);
  Serial.println("------------------------------------");
  Serial.println("Humidity");
  Serial.print  ("Sensor:       "); Serial.println(sensor.name);
  Serial.print  ("Driver Ver:   "); Serial.println(sensor.version);
  Serial.print  ("Unique ID:    "); Serial.println(sensor.sensor_id);
  Serial.print  ("Max Value:    "); Serial.print(sensor.max_value); Serial.println("%");
  Serial.print  ("Min Value:    "); Serial.print(sensor.min_value); Serial.println("%");
  Serial.print  ("Resolution:   "); Serial.print(sensor.resolution); Serial.println("%");  
  Serial.print  ("Min Delay:   "); Serial.print(sensor.min_delay); Serial.println("micro sec");  
  Serial.println("------------------------------------");
  
  pinMode(LEDPIN,OUTPUT);
  digitalWrite(LEDPIN,LOW);
  
  // Set delay between sensor readings based on sensor details.
  //delayMS = sensor.min_delay / 1000;
  //delayMS = 30000;
  delayMS = 20000;

  lastMS = millis();
  
}

void loop() {
  // Delay between measurements.

  currentMS = millis();

  if (serial2.available()) {
    Serial.write(serial2.read());
  }
  
  if(currentMS - lastMS >= delayMS)
  {

    digitalWrite(LEDPIN,HIGH);

    lastMS = currentMS;

    Serial.println("----------");
    
    float tempFarenheit = 0;
    float humidityPercent = 0;
    bool gotTemp = false;
    bool gotHumidity = false;
    
    // Get temperature event and print its value.
    sensors_event_t event;  
    dht.temperature().getEvent(&event);
    if (isnan(event.temperature)) {
      Serial.println("Error reading temperature!");
    }
    else {
      gotTemp = true;
      tempFarenheit = Fahrenheit(event.temperature);
      Serial.print("Temperature: ");
      Serial.print(tempFarenheit);
      Serial.println(" *F");
    }
    // Get humidity event and print its value.
    dht.humidity().getEvent(&event);
    if (isnan(event.relative_humidity)) {
      Serial.println("Error reading humidity!");
    }
    else {
      gotHumidity = true;
      humidityPercent = (float)event.relative_humidity;
      Serial.print("Humidity: ");
      Serial.print(humidityPercent);
      Serial.println("%");
    }
  
    if(gotTemp && gotHumidity){
      serial2.print(tempFarenheit, 2);
      serial2.print("_");
      serial2.println(humidityPercent, 2);  
    }

    Serial.println("----------");

    digitalWrite(LEDPIN,LOW);

  }
}
