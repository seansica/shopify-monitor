import https from 'https';

export async function getRequest (getOptions) {
  console.debug(`Executing util::http::getRequest - getOptions '${JSON.stringify(getOptions)}`);

  return new Promise((resolve, reject) => {
    const req = https.get(getOptions, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err) {
          console.error(err.message);
          reject(new Error(err));
        }
      });
    });

    req.on('error', err => {
      reject(new Error(err));
    });
  });
}

export async function postRequest (postOptions, body) {
  console.debug(`Executing util::http::postRequest - postOptions: '${JSON.stringify(postOptions)} body: '${JSON.stringify(body)}'`);
  return new Promise((resolve, reject) => {
    const req = https.request(postOptions, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err) {
          console.error(err);
          reject(new Error(err));
        }
      });
    });

    req.on('error', err => {
      console.error(err);
      reject(new Error(err));
    });

    // 👇️ write the body to the Request object
    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Http Response class to be returned by Lambda functions
 */
export class Response {
  constructor (statusCode, headers, body, isBase64Encoded) {
    this.statusCode = statusCode;
    this.headers = headers;
    this.body = body;
    this.isBase64Encoded = isBase64Encoded;
  }

  /**
   * Return the response
   * @returns A response object that will be returned from the Lambda function to the API gateway
   */
  toJSON () {
    return {
      statusCode: this.statusCode,
      headers: this.headers,
      body: JSON.stringify(this.body),
      isBase64Encoded: this.isBase64Encoded
    };
  }
}

/**
 * Builds a valid Response instance
 */
export class ResponseBuilder {
  constructor () {
    this.headers = {};
  }

  setStatusCode (statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  setHeader (key, value) {
    this.headers[key] = value;
    return this;
  }

  setBody (body) {
    this.body = body;
    return this;
  }

  setBase64Encoded (trueOrFalse) {
    this.isBase64Encoded = trueOrFalse;
    return this;
  }

  build () {
    if (!('statusCode' in this)) {
      throw new Error('"statusCode" is missing');
    }
    if (!('headers' in this)) {
      throw new Error('"headers" are missing');
    }
    if (!('body' in this)) {
      throw new Error('"body" is missing');
    }
    if (!('isBase64Encoded' in this)) {
      throw new Error('"isBase64Encoded" is missing');
    }
    return new Response(this.setStatusCode, this.headers, this.body, this.isBase64Encoded);
  }
}
