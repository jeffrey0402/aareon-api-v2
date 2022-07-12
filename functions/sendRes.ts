import { Response } from 'express'
/**
 * Build response based on the client Accept header.
 * It takes a response object, a status code, some data, and a pre-tag, and then it formats the response based on the request's Accept header.
 * @param {Response} response - Response - the response object
 * @param {number} statusCode - The HTTP status code to return.
 * @param {any} data - The data that you want to send back to the client.
 * @param {string} preTag - This is the tag that will be used to wrap the response data.
 */
const sendRes = (response: Response, statusCode: number, data: any, preTag: string) => {
  response.format({
    'application/json': () => {
      if (typeof data === 'string' || data instanceof String) {
        response.status(statusCode).json({
          message: data
        })
      } else {
        response.status(statusCode).json(data)
      }
    },
    'application/xml': () => {
      // TODO: fix XML only displaying strings.
      // Broken: dates.
      // build response in xml.
      if (typeof data === 'string' || data instanceof String) {
        const xml = `<${preTag}>${data}</${preTag}>`
        response.status(statusCode).send(xml)
      } else if (typeof data === 'object') {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>'
        if (preTag === 'company') {
          xml += '<companies>'
        } else {
          xml += `<${preTag}s>`
        }

        data.forEach((item: { [x: string]: any }) => {
          xml += `<${preTag}>`
          for (const key in item) {
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
      } else {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>'
        xml += `<${preTag}>`
        for (const key in data) {
          xml += `<${key}>${data[key]}</${key}>`
        }
        xml += `</${preTag}>`
        response.status(statusCode).send(xml)
      }
    },
    default: () => {
      // log the request and respond with 406
      response.status(406).send('Not Acceptable')
    }
  })
}

export default sendRes
