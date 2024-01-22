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

  const verificationToken = crypto.randomBytes(16).toString('hex');

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
          Text: {
            Data: `Please click the following link to verify your subscription: ${verificationLink}\n\nTo unsubscribe, click here: ${unsubscribeLink}`,
          },
        },
      },
    };

    // Send email
    await SES.sendEmail(params).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers" : "Content-Type",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
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
