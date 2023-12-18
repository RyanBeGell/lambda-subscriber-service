const AWS = require('aws-sdk');
const SES = new AWS.SES();
const DynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Parse email from event
    const { email } = JSON.parse(event.body);

    // Store in DynamoDB
    await DynamoDB.put({
        TableName: 'BlogSubscribers',
        Item: { email, isSubscribed: false }
    }).promise();

    // Generate a verification token 
    const verificationToken = 'some_generated_token'; // TODO: Replace with actual token generation logic

    // Construct the verification link (URL of your endpoint for EmailVerificationHandler)
    const verificationLink = `https://your-verification-endpoint.com/verify?token=${verificationToken}`;

    // Prepare SES email parameters
    const params = {
        Source: 'your-email@example.com', //TODO:  Replace with your verified SES email
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: 'Blog Subscription Verification' },
            Body: {
                Text: { Data: `Please click the following link to verify your subscription: ${verificationLink}` }
            }
        }
    };

    // Send verification email
    await SES.sendEmail(params).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Subscription initiated' }) };
};
