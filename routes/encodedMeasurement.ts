import express from 'express'
import Ajv from 'ajv'
import prisma from '../prisma'

import * as schema from '../schemas/draft-07/encodedMeasurement.json'

import addFormats from 'ajv-formats'
import sendRes from '../functions/sendRes'
const codec = require('@adeunis/codecs')
const router = express.Router()

// Init JSON Schema Validator and Preload schemas.
const ajv = new Ajv()

addFormats(ajv)
const validate = ajv.compile(schema)

router.post('/', async (req, res) => {
  const payloadValue : [
        {
            bn: 'urn:dev:DEVEUI:0018B21000008CF4:'; // Device ID
            bt: 1652972601; // timestamp
        },
        {
            n: 'payload';
            vs: '6a2000d440013900d33f013900d33e013a00d33b013800d238013a00d238013e'; // actual payload data to decode
        },
        {
            n: 'port';
            v: 1;
        }
  ] = req.body
  console.log(payloadValue)

  const decoder = new codec.Decoder()

  if (!validate) {
    sendRes(res, 400, 'validation error', 'error')
  }

  const sensorId = payloadValue[0].bn.replace('urn:dev:DEVEUI:', '').replace(':', '')
  const dataBytes = payloadValue[1].vs
  const deviceTypes = decoder.findDeviceTypes(dataBytes)
  const timestamp = new Date(payloadValue[0].bt * 1000)

  decoder.setDeviceType(deviceTypes[0])

  if (deviceTypes[0] === 'comfortCo2') {
    // Decode data
    let dataResult: {
        type: '0x6a Comfort CO2 data';
        status: {
            frameCounter: 0;
            hardwareError: false;
            lowBattery: false;
            configurationDone: false;
            configurationInconsistency: false;
            timestamp: false;
        };
        decodingInfo: 'values: [t=0, t-1, t-2, ...]';
        temperature: { unit: '°C'; values: [22.1, 22.1, 22.2, 22.2, 22.2, 22.2] };
        humidity: { unit: '%'; values: [45, 45, 45, 45, 45, 45] };
        co2: { unit: 'ppm'; values: [252, 246, 252, 246, 250, 249] };
    } // dummy data for autocompletion :)
    // eslint-disable-next-line prefer-const
    dataResult = decodeData(decoder, dataBytes)

    // AVG results
    const avgTemp = getAvg(dataResult.temperature.values)
    const avgHum = getAvg(dataResult.humidity.values)
    const avgCo2 = getAvg(dataResult.co2.values)

    // Log by to console by default
    if (process.env.LOG_SENSORDATA === 'true' || process.env.LOG_SENSORDATA === undefined) {
      console.log(`ID: ${sensorId} TYPES: ${deviceTypes} `)
      console.log(`TEMP: ${avgTemp} HUM: ${avgHum} CO2: ${avgCo2}`)
    }

    // Save to database
    try {
      const newMeasurements = await prisma.measurements.createMany({
        data: [
          { value: avgTemp, sensor_device_uuid: sensorId, timestamp, type_name: 'temperature' },
          { value: avgHum, sensor_device_uuid: sensorId, timestamp, type_name: 'humidity' },
          { value: avgCo2, sensor_device_uuid: sensorId, timestamp, type_name: 'co2' }
        ]
      })
      sendRes(res, 200, newMeasurements, 'success')
    } catch (error) {
      sendRes(res, 400, 'error inserting data', 'error')
    }

    // Check if battery from dataResult is low, and if so update sensor in DB with battery = 0
    if (dataResult.status.lowBattery) {
      try {
        await prisma.sensors.update({
          where: {
            device_uuid: sensorId
          },
          data: {
            battery: 0,
            updated_at: new Date()
          }
        })
      } catch (error) {
        sendRes(res, 400, 'error updating sensor', 'error')
      }
    }
  } else if (deviceTypes[0] === 'drycontacts') {
    // Decode data
    let dataResult: {
        type: '0x40 Dry Contacts data';
        status: {
            frameCounter: 2;
            hardwareError: false;
            lowBattery: false;
            configurationDone: false;
        };
        decodingInfo: 'true: ON/CLOSED, false: OFF/OPEN';
        channelA: {
            value: 1;
            currentState: true;
            previousFrameState: false;
        };
        channelB: {
            value: 0;
            currentState: false;
            previousFrameState: false;
        };
        channelC: {
            value: 5;
            currentState: false;
            previousFrameState: false;
        };
        channelD: {
            value: 2;
            currentState: false;
            previousFrameState: false;
        };
    } // dummy data for autocompletion :)
    // eslint-disable-next-line prefer-const
    dataResult = decodeData(decoder, dataBytes)

    // AVG results
    const dryContactValue = dataResult.channelA.value

    // Log by to console by default
    if (process.env.LOG_SENSORDATA === 'true' || process.env.LOG_SENSORDATA === undefined) {
      console.log(`ID: ${sensorId} TYPES: ${deviceTypes} `)
      console.log(dryContactValue)
    }

    // Save to database
    try {
      const newMeasurements = await prisma.measurements.createMany({
        data: [
          { value: dryContactValue, sensor_device_uuid: sensorId, timestamp, type_name: 'drycontacts' }
        ]
      })
      sendRes(res, 200, newMeasurements, 'success')
    } catch (error) {
      sendRes(res, 400, 'error inserting data', 'error')
    }

    // Check if battery from dataResult is low, and if so update sensor in DB with battery = 0
    if (dataResult.status.lowBattery) {
      try {
        await prisma.sensors.update({
          where: {
            device_uuid: sensorId
          },
          data: {
            battery: 0,
            updated_at: new Date()
          }
        })
      } catch (error) {
        sendRes(res, 400, 'error updating sensor', 'error')
      }
    }
  } else {
    console.log('New device type not in database: ' + deviceTypes)
    console.log('Data: ' + dataBytes)
    sendRes(res, 400, `devicetype ${deviceTypes[0]} is currently not supported.`, 'error')
  }
})

const decodeData = (decoder: any, sensorBytes: string) => {
  let result = decoder.decode(sensorBytes)
  if (result.error) {
    result = 'decoding issue'
  }
  return result
}

/**
 * The function takes an array of numbers as an argument and returns the average of the numbers in the array.
 * @param arr - Array<number> - This is the array that we're going to be passing into the function.
 * @returns The average of the numbers in the array.
 */
function getAvg (arr: Array<number>) {
  let total = 0
  arr.forEach((element) => {
    total = total + element
  })
  return total / arr.length
}
