/* eslint-disable */

const config = {
  aws_appsync_region: import.meta.env.VITE_COGNITO_REGION,
  aws_appsync_graphqlEndpoint: import.meta.env.VITE_GRAPHQL_URL,
  // aws_appsync_authenticationType: 'API_KEY',
  // aws_appsync_apiKey: '',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  Auth: {
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITYPOOLID,

    // REQUIRED - Amazon Cognito Region
    region: import.meta.env.VITE_COGNITO_REGION,

    //   // OPTIONAL - Amazon Cognito Federated Identity Pool Region
    //   // Required only if it's different from Amazon Cognito Region
    // identityPoolRegion: 'XX-XXXX-X',

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: import.meta.env.VITE_COGNITO_USERPOOLID,

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: import.meta.env.VITE_COGNITO_WEBCLIENTID,

    //   // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,

    //   // OPTIONAL - Configuration for cookie storage
    //   // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
    //   cookieStorage: {
    //   // REQUIRED - Cookie domain (only required if cookieStorage is provided)
    //       domain: '.yourdomain.com',
    //   // OPTIONAL - Cookie path
    //       path: '/',
    //   // OPTIONAL - Cookie expiration in days
    //       expires: 365,
    //   // OPTIONAL - See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
    //       sameSite: "strict" | "lax",
    //   // OPTIONAL - Cookie secure flag
    //   // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
    //       secure: true
    //   },

    // OPTIONAL - customized storage object
    storage: window.sessionStorage,

    //   // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    authenticationFlowType: 'USER_SRP_AUTH',

    //   // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
    //   clientMetadata: { myCustomKey: 'myCustomValue' },

    //    // OPTIONAL - Hosted UI configuration
    //   oauth: {
    //       domain: 'your_cognito_domain',
    //       scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
    //       redirectSignIn: 'http://localhost:3000/',
    //       redirectSignOut: 'http://localhost:3000/',
    //       responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
    //   }
  },
  Storage: {
    AWSS3: {
      bucket: '', //REQUIRED -  Amazon S3 bucket name
      region: '', //OPTIONAL -  Amazon service region
    },
  },
  API: {
    endpoints: [
      {
        name: 'Api',
        endpoint:
          import.meta.env.VITE_HTTP_API ||
          import.meta.env.VITE_REST_API ||
          null,
      },
    ],
  },
};

export default config;
