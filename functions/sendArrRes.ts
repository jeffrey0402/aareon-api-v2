import _ from 'lodash'
import { Response } from 'express'
/**
 * Build response based on the client Accept header.
 * It takes a response object, a status code, some data, and a pre-tag, and then it formats the response based on the request's Accept header.
 * This function exists because sending arrays of objects does not go well with the xml builder.
 * @param {Response} response - Response - the response object
 * @param {number} statusCode - The HTTP status code to return.
 * @param {any} data - The data that you want to send back to the client.
 * @param {string} preTag - This is the tag that will be used to wrap the response data.
 */
const sendArrRes = (response: Response, statusCode: number, data: Array<any>, preTag: string) => {
  response.format({
    'application/json': () => {
      if (typeof data === 'string' || data instanceof String) {
        response.status(statusCode).json({
          message: data
        })
      } else {
        // remove replace keys with camelcase values
        const newData = _.map(data, (value: any, key: any) => {
          return _.mapKeys(value, (value: any, key: any) => {
            return _.camelCase(key)
          })
        })
        response.status(statusCode).send(newData)
      }
    },
    'application/xml': () => {
      // manually build xml from array of objects
      let xml = '<?xml version="1.0" encoding="UTF-8"?>'
      if (preTag === 'company') {
        xml += '<companies>'
      } else {
        xml += `<${preTag}s>`
      }
      data.forEach(item => {
        xml += `<${preTag}>`
        for (let key in item) {
          key = camalize(key)
          xml += `<${key}>${item[key]}</${key}>`
        }
        xml += `</${preTag}>`
      })
      if (preTag === 'company') {
        xml += '</companies>'
      } else {
        xml += `</${preTag}s>`
      }

      response.status(statusCode).send(xml)
    },
    default: () => {
      // log the request and respond with 406
      response.status(406).send('Not Acceptable')
    }
  })
}

const camalize = function camalize (str: string) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
}

export default sendArrRes
