# Config doc

These properties in details are as follows.

| Property         | Description                                                                                        | Type                            | Default value                                           |
| ---------------- | -------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| appName          | Application name for stack                                                                         | string                          | `dev`                                                   |
| alias            | `StageAlias` in tag                                                                                | string                          | `japan-hcls`                                            |
| awsProfile       | Define your aws profile as same as that in `cdk.json`                                              | string                          | `your_profile`                                          |
| adminEmail       | Send the temporary password to this email for signing graph application                            | string                          | `your_email@acme.com`                                   |
| allowedIps       | AWS WAF allowed this ips to access to the graph application. e.g.) [`"192.0.3.0/24"`]              | string[]                        | `["192.0.3.0/24"]`                                      |
| ssmPath          | The prefix of Paramater store in AWS Systems Manager which stores the parameters related to webapp | string                          | `/omics`                                                |
| userPoolId       | The name of Paramater store in AWS Systems Manager for userPoolId                                  | string                          | `userPoolId`                                            |
| identityPoolId   | The name of Paramater store in AWS Systems Manager for identityPoolId                              | string                          | `identityPoolId`                                        |
| userPoolClientId | The name of Paramater store in AWS Systems Manager for userPoolClientId                            | string                          | `userPoolClientId`                                      |
| functionUrl      | The name of Paramater store in AWS Systems Manager for functionUrl                                 | string                          | `functionUrl`                                           |
| graphqlUrl       | The name of Paramater store in AWS Systems Manager for graphqlUrl                                  | string                          | `graphqlUrl`                                            |
| omicsBuckets     | S3 bucket name of input and output for AWS HealthOmics                                             | { input: string,output: string} | `{input: "InputBucketName",output: "outputBucketName"}` |
