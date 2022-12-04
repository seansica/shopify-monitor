import { postRequest } from './http.mjs';

export async function postToDiscord (path, messageContent) {
  console.debug(`Executing discord::postToDiscord - path: '${path}' messageContent: '${JSON.stringify(messageContent)}'`);

  // will be used if messageContent is undefined
  // const defaultBody = '{"content": "Posted Via Command line"}';
  // const body = messageContent ? JSON.stringify({ content: messageContent }) : defaultBody;

  if (!messageContent) {
    console.warn('No messageContent received. Skipping postToDiscord.');
    return;
  }

  const body = {
    content: JSON.stringify(messageContent)
  };

  const options = {
    hostname: 'discord.com',
    path,
    method: 'POST',
    port: 443, // 👈️ replace with 80 for HTTP requests
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  try {
    const res = await postRequest(options, body);
    console.debug(`Discord response: ${JSON.stringify(res)}`);
    return res;
  } catch (err) {
    console.error('Discord threw an error!');
    console.error('Error', err.message);
    return err;
  }
}

export function prettifyMessage (message) {
  if ('title' in message &&
      'quantity' in message &&
      'site' in message) {
    return `${message.title} - ${message.quantity ? message.quantity : 'unknown qty of'} units available!!! [Link](${message.site})`;
  }
}
