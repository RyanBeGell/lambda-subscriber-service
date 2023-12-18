const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Parse verification token from the query string
    const token = event.queryStringParameters.token;

    // Retrieve the email associated with the token
    const response = await DynamoDB.scan({
        TableName: 'BlogSubscribers',
        FilterExpression: 'verificationToken = :t',
        ExpressionAttributeValues: { ':t': token }
    }).promise();

    // Check if a record with the given token was found
    if (response.Items.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Token not found' }) };
    }

    // Assuming token is unique and only one record will be returned
    const email = response.Items[0].email;

    // Update DynamoDB to mark the email as subscribed
    await DynamoDB.update({
        TableName: 'BlogSubscribers',
        Key: { email },
        UpdateExpression: 'set isSubscribed = :v',
        ExpressionAttributeValues: { ':v': true },
        ReturnValues: 'UPDATED_NEW'
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Subscription confirmed' }) };
};
