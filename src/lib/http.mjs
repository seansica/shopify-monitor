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
