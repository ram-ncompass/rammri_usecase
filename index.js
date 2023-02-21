const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');


const CLIENT_ID = '163334261773-mpogg6o89cgcumr03c452j2dkgpg83kc.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const oAuth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the URL for user consent
const authorizeUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES
});

console.log(`Authorize URL: ${authorizeUrl}`);

const authorizationCode = decodeURIComponent('4%2F0AWtgzh6dZG9RWrRZVDpyTeTgPZHwhkn2uesV93hdXvhA1p6nmb_IJTHXNtTZQhC7miA_aA');
console.log(authorizationCode);

async function getTokensFromAuthorizationCode(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log(tokens);
  oAuth2Client.setCredentials(tokens);
  return tokens;
}

// Set the access token and refresh token on the OAuth2 client

async function listMessages(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
  
    const res = await gmail.users.messages.list({
      userId: 'me',
    });
  
    console.log(res.data);
}

async function getAttachments(auth) {
    const gmail = google.gmail({ version: 'v1', auth: auth });
    const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'has:attachment'
    });
      
    const messages = response.data.messages;
    // console.log('1', messages);
    let files = {}

    for (let message of messages) {
        const response = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });
      
        const messageData = response.data;
        // console.log('2', messageData.payload.headers[17].value);
      
        // Extract attachment information from the message payload
        const attachment = messageData.payload.parts.find((part) => {
            return (
              part.filename &&
              part.body.attachmentId
            );
          });
          // console.log('3', attachment);
          if (attachment) {
            files[attachment.filename] = messageData.payload.headers[17].value
            // Download the attachment using the attachment ID
            const attachmentData = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageData.id,
                id: attachment.body.attachmentId,
              });
            const attachmentContent = attachmentData.data.data;
            const attachmentBuffer = Buffer.from(attachmentContent, 'base64');
            fs.writeFile(attachment.filename, attachmentBuffer, (err) => {
              if (err) {
                console.error('Error writing file:', err);
              } else {
                console.log('Attachment saved:', attachment.filename);
              }
            }); 
          }         
      }   
}

async function main() {
    await getTokensFromAuthorizationCode(authorizationCode);
    await listMessages(oAuth2Client)
    await getAttachments(oAuth2Client)
}
main()
  