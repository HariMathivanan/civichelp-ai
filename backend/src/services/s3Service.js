const fs = require('fs');
const path = require('path');
const {
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand
} = require('@aws-sdk/client-s3');
const { getS3Client, isAwsConfigured } = require('../config/s3Client');
const config = require('../config/env');

function getLocalVaultFiles() {
  const vaultPath = config.KNOWLEDGE_VAULT_PATH;
  if (!fs.existsSync(vaultPath)) {
    return [];
  }
  return fs.readdirSync(vaultPath).filter(file => file.endsWith('.json'));
}

async function getVaultStatus() {
  const localFiles = getLocalVaultFiles();
  const configured = isAwsConfigured();

  if (!configured) {
    return {
      configured: false,
      isAccessible: false,
      bucket: config.AWS_S3_BUCKET_NAME,
      region: config.AWS_REGION,
      message: 'AWS S3 credentials are not configured in environment variables. Operating with local verified knowledge vault.',
      localFilesCount: localFiles.length,
      localFiles
    };
  }

  try {
    const s3 = getS3Client();

    // Verify bucket accessibility
    await s3.send(new HeadBucketCommand({ Bucket: config.AWS_S3_BUCKET_NAME }));

    // List objects in S3
    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket: config.AWS_S3_BUCKET_NAME
      })
    );

    const s3Objects = (listResponse.Contents || []).map(obj => ({
      key: obj.Key,
      sizeBytes: obj.Size,
      lastModified: obj.LastModified
    }));

    const schemeKeys = s3Objects.map(o => path.basename(o.key));
    const inSync = localFiles.every(file => schemeKeys.includes(file));

    return {
      configured: true,
      isAccessible: true,
      bucket: config.AWS_S3_BUCKET_NAME,
      region: config.AWS_REGION,
      objectCount: s3Objects.length,
      s3Objects,
      localFilesCount: localFiles.length,
      localFiles,
      inSync,
      message: inSync
        ? 'Amazon S3 knowledge vault is fully synchronized with local verified documents.'
        : 'Some local knowledge documents have not yet been synced to Amazon S3.'
    };
  } catch (error) {
    return {
      configured: true,
      isAccessible: false,
      bucket: config.AWS_S3_BUCKET_NAME,
      region: config.AWS_REGION,
      error: error.message,
      errorCode: error.name || error.Code,
      localFilesCount: localFiles.length,
      localFiles,
      message: `Failed to connect to Amazon S3 bucket '${config.AWS_S3_BUCKET_NAME}': ${error.message}`
    };
  }
}

async function syncVaultToS3() {
  if (!isAwsConfigured()) {
    const error = new Error('AWS credentials or S3 bucket name are not configured in .env');
    error.statusCode = 400;
    throw error;
  }

  const s3 = getS3Client();
  const vaultPath = config.KNOWLEDGE_VAULT_PATH;
  const localFiles = getLocalVaultFiles();

  if (localFiles.length === 0) {
    throw new Error(`No knowledge vault files found in ${vaultPath}`);
  }

  const uploadedFiles = [];

  for (const fileName of localFiles) {
    const filePath = path.join(vaultPath, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Determine S3 destination key
    const s3Key = fileName === 'registry.json'
      ? 'metadata/registry.json'
      : `schemes/${fileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/json',
      Metadata: {
        'source-filename': fileName,
        'verification-status': 'VERIFIED_OFFICIAL',
        'uploaded-at': new Date().toISOString()
      }
    });

    await s3.send(putCommand);
    uploadedFiles.push({
      fileName,
      s3Key,
      sizeBytes: Buffer.byteLength(fileContent, 'utf-8')
    });
  }

  return {
    success: true,
    bucket: config.AWS_S3_BUCKET_NAME,
    region: config.AWS_REGION,
    totalUploaded: uploadedFiles.length,
    uploadedFiles,
    timestamp: new Date().toISOString()
  };
}

async function fetchDocumentFromS3(key) {
  if (!isAwsConfigured()) {
    throw new Error('AWS S3 is not configured.');
  }

  const s3 = getS3Client();
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: config.AWS_S3_BUCKET_NAME,
      Key: key
    })
  );

  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });

  const bodyContent = await streamToString(response.Body);
  return JSON.parse(bodyContent);
}

module.exports = {
  getVaultStatus,
  syncVaultToS3,
  fetchDocumentFromS3,
  getLocalVaultFiles
};
