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
      } else {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>'
        xml += `<${preTag}>`
        for (let key in data) {
          key = camalize(key)
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

// function toCamelCase (str: string) {
//   let newStr = ''
//   if (str) {
//     const wordArr = str.split(/[-_]/g)
//     for (const i in wordArr) {
//       if (i > 0) {
//         newStr += wordArr[i].charAt(0).toUpperCase() + wordArr[i].slice(1)
//       } else {
//         newStr += wordArr[i]
//       }
//     }
//   } else {
//     return newStr
//   }
//   return newStr
// }
const camalize = function camalize (str: string) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
}

export default sendRes
