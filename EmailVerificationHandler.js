const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();
const crypto = require('crypto');


exports.handler = async (event) => {
  // Check if queryStringParameters is present and has the token
  if (!event.queryStringParameters || !event.queryStringParameters.token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Token query parameter is missing' }),
    };
  }

  // Parse verification token from the query string
  const token = event.queryStringParameters.token;

  // Retrieve the email associated with the token
  const response = await DynamoDB.scan({
    TableName: 'BlogSubscribers',
    FilterExpression: 'verificationToken = :t',
    ExpressionAttributeValues: { ':t': token },
  }).promise();

  // Check if a record with the given token was found
  if (response.Items.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Token not found' }),
    };
  }

  // Assuming token is unique and only one record will be returned
  const email = response.Items[0].email;

  // Update DynamoDB to mark the email as subscribed
  await DynamoDB.update({
    TableName: 'BlogSubscribers',
    Key: { email },
    UpdateExpression: 'set isSubscribed = :v',
    ExpressionAttributeValues: { ':v': true },
    ConditionExpression: 'attribute_exists(email)', // Ensure the email exists
  }).promise();

  return {
    statusCode: 302,
    headers: {
      Location: `http://localhost:3000/subscriptions/subscription-confirmed?token=${encodeURIComponent(token)}`
    }
  };
};
