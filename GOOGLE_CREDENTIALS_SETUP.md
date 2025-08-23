# Google Service Account Credentials Setup

This application uses Google Sheets and Google Drive APIs. To authenticate with these services, you need to set up a Google Service Account and configure the credentials.

## Setup Instructions

### 1. Create a Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API and Google Drive API
4. Go to "IAM & Admin" > "Service Accounts"
5. Click "Create Service Account"
6. Give it a name and description
7. Grant the service account the necessary permissions (Editor role is typically sufficient)
8. Create a new key (JSON format)
9. Download the JSON key file

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Google Service Account Credentials (entire JSON content)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}'
```

### 3. Important Notes

- The `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` should contain the **entire JSON content** from your service account key file
- Make sure to escape any quotes or special characters in the JSON string
- The application will automatically create a temporary file from this JSON content for authentication
- Never commit your `.env` file to version control (it's already in `.gitignore`)

### 4. Testing the Setup

You can test if the credentials are working by running a simple Google Sheets operation:

```ruby
# In Rails console
External::GoogleSheetsApi.read_sheet('your_spreadsheet_id', 'Sheet1')
```

If you get data back instead of an authentication error, your setup is working correctly.
