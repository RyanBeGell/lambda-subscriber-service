const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  if (!event.queryStringParameters || !event.queryStringParameters.token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Token query parameter is missing' }),
    };
  }

  const token = event.queryStringParameters.token;

  // Retrieve the email associated with the token
  const response = await DynamoDB.scan({
    TableName: 'BlogSubscribers',
    FilterExpression: 'verificationToken = :t',
    ExpressionAttributeValues: { ':t': token },
  }).promise();

  if (response.Items.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Token not found' }),
    };
  }

  const email = response.Items[0].email;

  // Update DynamoDB to mark the email as unsubscribed
  await DynamoDB.update({
    TableName: 'BlogSubscribers',
    Key: { email },
    UpdateExpression: 'set isSubscribed = :v',
    ExpressionAttributeValues: { ':v': false },
    ConditionExpression: 'attribute_exists(email)',
  }).promise();

  return {
    statusCode: 302,
    headers: {
      Location: 'http://localhost:3000/subscriptions/unsubscribe-confirmed',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
  };
};
