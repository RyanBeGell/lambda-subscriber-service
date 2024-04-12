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
                <img src="data:image/png;base64,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" height="64" width="64 "Logo" style="margin-bottom: 8px;">
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
