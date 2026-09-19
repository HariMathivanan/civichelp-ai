const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./env');

let s3ClientInstance = null;

function getS3Client() {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  const endpointUrl = config.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL_S3;
  const region = config.AWS_REGION || process.env.AWS_REGION || 'ap-south-1';

  const clientConfig = {
    region
  };

  if (endpointUrl) {
    // LocalStack / S3-compatible local environment mode
    clientConfig.endpoint = endpointUrl;
    clientConfig.forcePathStyle = true;
    clientConfig.credentials = {
      accessKeyId: config.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'test'
    };
  } else {
    // Real AWS mode: use explicit credentials if configured, otherwise rely on default credential chain
    if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY
      };
    }
  }

  s3ClientInstance = new S3Client(clientConfig);
  return s3ClientInstance;
}

function isAwsConfigured() {
  const endpointUrl = config.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL_S3;
  return Boolean(
    config.AWS_S3_BUCKET_NAME &&
    (
      endpointUrl ||
      (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI ||
      process.env.AWS_ROLE_ARN ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_SESSION_TOKEN
    )
  );
}

module.exports = {
  getS3Client,
  isAwsConfigured
};
