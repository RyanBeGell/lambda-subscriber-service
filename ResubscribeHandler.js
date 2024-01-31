const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Check if queryStringParameters is present and has the token
  if (!event.queryStringParameters || !event.queryStringParameters.token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Token query parameter is missing' }),
    };
  }

  // Parse re-subscription token from the query string
  const token = event.queryStringParameters.token;

  try {
    // Retrieve the email associated with the token
    const scanResponse = await DynamoDB.scan({
      TableName: 'BlogSubscribers',
      FilterExpression: 'verificationToken = :t',
      ExpressionAttributeValues: { ':t': token },
    }).promise();

    if (scanResponse.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Token not found' }),
      };
    }

    const email = scanResponse.Items[0].email;

    try {
      // Update DynamoDB to mark the email as re-subscribed
      await DynamoDB.update({
        TableName: 'BlogSubscribers',
        Key: { email },
        UpdateExpression: 'set isSubscribed = :v',
        ExpressionAttributeValues: { ':v': true },
        ConditionExpression: 'attribute_exists(email)',
      }).promise();

      // Redirect to a confirmation page
      return {
        statusCode: 302,
        headers: {
          Location: `http://localhost:3000/subscriptions/subscription-confirmed`,
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: JSON.stringify({ message: 'Re-subscription successful' }),
      };
    } catch (updateError) {
      console.error('Error updating DynamoDB:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error updating subscription status' }),
      };
    }
  } catch (scanError) {
    console.error('Error scanning DynamoDB:', scanError);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};