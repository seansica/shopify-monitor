import https from 'https';
import { RequestOptions } from "http";
import * as HttpCodes from 'http-codes';

export async function getRequest (options: RequestOptions) {
  console.debug(`Executing util::http::getRequest - getOptions '${JSON.stringify(options)}`);

  return new Promise((resolve, reject) => {
    const req = https.get(options, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err: unknown) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          console.error(err.message);
          reject(err);
        }
      });
    });

    req.on('error', err => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reject(err);
    });
  });
}

/**
 *
 * @param {{ hostname, path, method, port, headers }} options
 * @param { string } body
 * @returns {Promise<unknown>}
 */
export async function postRequest (options: RequestOptions, body: string) {
  console.debug(`Executing util::http::postRequest - postOptions: '${JSON.stringify(options)} body: '${body}'`);
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err) {
          console.error(err);
          reject(err);
        }
      });
    });

    req.on('error', (err: Error) => {
      console.error(err);
      reject(err);
    });

    // 👇️ write the body to the Request object
    // req.write(JSON.stringify(body));
    req.write(body);
    req.end();
  });
}


class Response extends Error {
  statusCode = 0; // default value
  body = JSON.stringify({ message: '' }); // default value

  constructor (statusCode: number, body?: string) {
    super();
    this.body = body? body : this.body;
    this.statusCode = (statusCode && statusCode in HttpCodes) ? statusCode : this.statusCode;
  }
}

export class ResponseSuccess extends Response {
  constructor(body?: string, statusCode?: number) {
    super(
        statusCode ? statusCode : HttpCodes.ACCEPTED,
        body ? body : 'ok'
    );
  }
}

export class ResponseError extends Response {
  constructor(body?: string, statusCode?: number) {
    super(
        statusCode ? statusCode : HttpCodes.BAD_REQUEST,
        body ? body : 'error'
    );
  }
}
