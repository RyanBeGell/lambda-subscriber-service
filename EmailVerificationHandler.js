const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Parse verification token from the query string
    const token = event.queryStringParameters.token;

    // Retrieve the email associated with the token
    // This requires you to store the association between tokens and emails somewhere, 
    // possibly in another DynamoDB table or as part of the BlogSubscribers table
    
    const email = 'email_retrieved_based_on_token'; //TODO: Replace with actual logic to retrieve email

    // Update DynamoDB
    await DynamoDB.update({
        TableName: 'BlogSubscribers',
        Key: { email },
        UpdateExpression: 'set isSubscribed = :v',
        ExpressionAttributeValues: { ':v': true }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Subscription confirmed' }) };
};
