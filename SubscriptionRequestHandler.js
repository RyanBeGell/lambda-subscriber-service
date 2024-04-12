const AWS = require('aws-sdk');
const SES = new AWS.SES();
const DynamoDB = new AWS.DynamoDB.DocumentClient();
const crypto = require('crypto');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);

  // Validate email
  if (!email || !validateEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid email address' }),
    };
  }

  const verificationToken = crypto.randomUUID();

  // Check environment variable
  if (!process.env.VERIFICATION_LINK_BASE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error' }),
    };
  }

  try {
    // Store in DynamoDB with verification token
    await DynamoDB.put({
      TableName: 'BlogSubscribers',
      Item: { email, isSubscribed: false, verificationToken },
    }).promise();

    // Construct verification link
    const verificationLink = `${process.env.VERIFICATION_LINK_BASE_URL}/verify?token=${verificationToken}`;

    // Construct unsubscribe link
    const unsubscribeLink = `${process.env.VERIFICATION_LINK_BASE_URL}/unsubscribe?token=${verificationToken}`;

    // SES email parameters
    const params = {
      Source: 'noreply@ryanbegell.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Blog Subscription Verification' },
        Body: {
          Html: {
            Data: `
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: black; }
                .button { background-color: #2196F3; color: white; padding: 10px 20px; text-align: center; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; text-decoration: none; border-radius: 5px; }
                .header { font-size: 32px; margin-top: 20px; font-weight: 700; }
                .footer { font-size: 14px; color: #777; margin-top: 20px; }
                .unsubscribe { font-size: 14px; color: #555; margin-top: 5px; text-decoration: none; color: #2196F3; }
              </style>
            </head>
            <body>
              <center>
                <img src="https://raw.githubusercontent.com/RyanBeGell/portfolio-site/main/public/favicon.png" height="64" width="64 "Logo" style="margin-bottom: 8px;">
                <div class="header">Please Confirm Your Subscription</div>
                <br/>
                <br/>
                <a href="${verificationLink}" class="button">Yes, subscribe me to this list</a>
                <br/>
                <br/>
                <p class="footer">
                  If you received this email by mistake, simply delete it. You won't be subscribed if you don't click the confirmation link above.
                </p>
                <p class="footer">
                  To unsubscribe, <a href="${unsubscribeLink}" class="unsubscribe">click here</a>.
                </p>
              </center>
            </body>
            </html>
            
            `,
          },
        },
      },
    };

    // Send email
    await SES.sendEmail(params).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      },
      body: JSON.stringify({ message: 'Subscription initiated' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
