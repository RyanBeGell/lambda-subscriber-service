const AWS = require('aws-sdk');
const SES = new AWS.SES();
const DynamoDB = new AWS.DynamoDB.DocumentClient();
const crypto = require('crypto');

exports.handler = async (event) => {
    const { email } = JSON.parse(event.body);
    const verificationToken = crypto.randomBytes(16).toString('hex');

    // Store in DynamoDB with verification token
    await DynamoDB.put({
        TableName: 'BlogSubscribers',
        Item: { email, isSubscribed: false, verificationToken }
    }).promise();

    // Construct verification link, env variable stored in AWS
    const verificationLink = `${process.env.VERIFICATION_LINK_BASE_URL}/verify?token=${verificationToken}`;

    // SES email parameters
    const params = {
        Source: 'noreply@ryanbegell.com',
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: 'Blog Subscription Verification' },
            Body: {
                Text: { Data: `Please click the following link to verify your subscription: ${verificationLink}` }
            }
        }
    };

    // Send email
    await SES.sendEmail(params).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Subscription initiated' }) };
};
