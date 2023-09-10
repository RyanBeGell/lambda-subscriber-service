const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();


async function sendConfirmationEmail(email, confirmationToken) {
  const ses = new AWS.SES();

  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Text: {
          Data: `Thank you for subscribing. To confirm your subscription, click this link: https://example.com/confirm?token=${confirmationToken}`,
        },
      },
      Subject: {
        Data: 'Confirm your subscription',
      },
    },
    Source: '', 
  };

  await ses.sendEmail(params).promise();
}


// Function to subscribe a user
async function subscribeUser(email) {
  const params = {
    TableName: 'YourTableName',
    Item: {
      Email: email,
      Confirmed: false,
    },
  };

  await dynamodb.put(params).promise();
}


async function confirmSubscription(email, confirmationToken) {
  const params = {

    TableName: '', 
    Key: {
      Email: email,
    },
    UpdateExpression: 'SET Confirmed = :confirmed',
    ConditionExpression: 'attribute_exists(Email) AND attribute_not_exists(Confirmed)',
    ExpressionAttributeValues: {
      ':confirmed': true,
    },
  };

  try {
    await dynamodb.update(params).promise();
    // Successfully confirmed subscription
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subscription confirmed successfully' }),
    };
  } catch (error) {
    //dynamoDB conditionalCheckFailed exception
    if (error.name === 'ConditionalCheckFailedException') {
      // User is already confirmed or doesn't exist
      console.log('User is already confirmed or doesn\'t exist.');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User is already confirmed or doesn\'t exist' }),
      };
    } else {
      console.error('Error confirming subscription:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }
  }
}