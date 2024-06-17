import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminListGroupsForUserCommand,
  ListGroupsCommand,
  ListUsersCommand,
  UserType,
  AttributeType,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { Auth } from 'aws-amplify';
import { useAuthStore } from '../../stores/auth-store';
import { has, filter } from 'lodash';

type CreateUserInput = {
  username: string;
  email: string;
};

type AddUserGroupInput = {
  username: string;
  groupName: string;
};

const region = import.meta.env.VITE_COGNITO_REGION;

const getAuth = () => {
  const auth = useAuthStore();
  return auth;
};
const cognitoClient = async () => {
  return new CognitoIdentityProviderClient({
    credentials: await Auth.currentCredentials(),
    region,
  });
};

export const createUser = async (params: CreateUserInput) => {
  try {
    const userPoolId = await getAuth().userPoolId;
    const client = await cognitoClient();
    const userAttributes = await getAuth().userAttributes;
    const command = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: params.username,
      UserAttributes: [
        {
          Name: 'email',
          Value: params.email,
        },
      ],
    });
    const response = await client.send(command);
    if (has(userAttributes, 'custom:tenantId')) {
      const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: params.username,
        UserAttributes: [
          {
            Name: 'custom:tenantId',
            Value: userAttributes['custom:tenantId'],
          },
        ],
      });
      await client.send(updateUserAttributesCommand);
    }
    return response;
  } catch (error) {
    return error;
  }
};

export const addUserToGroup = async (params: AddUserGroupInput) => {
  try {
    const userPoolId = await getAuth().userPoolId;
    const client = await cognitoClient();
    const command = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: params.username,
      GroupName: params.groupName,
    });
    const response = await client.send(command);
    return response;
  } catch (error) {
    return error;
  }
};

export const deleteUser = async (username: string) => {
  const userPoolId = await getAuth().userPoolId;
  const client = await cognitoClient();
  const command = new AdminDeleteUserCommand({
    Username: username,
    UserPoolId: userPoolId,
  });
  const response = await client.send(command);
  return response;
};

export const getCognitoUsers = async () => {
  const userPoolId = await getAuth().userPoolId;
  const client = await cognitoClient();
  const command = new ListUsersCommand({
    UserPoolId: userPoolId,
  });
  const response = await client.send(command);
  return response;
};

export const listGroups = async () => {
  const userPoolId = await getAuth().userPoolId;
  const client = await cognitoClient();
  const command = new ListGroupsCommand({
    UserPoolId: userPoolId,
  });
  const response = await client.send(command);
  return response;
};
export const listUsers = async () => {
  const userPoolId = await getAuth().userPoolId;
  const userAttributes = await getAuth().userAttributes;
  const client = await cognitoClient();
  const command = new ListUsersCommand({
    UserPoolId: userPoolId,
  });
  const userList: any[] = [];
  const response = await client.send(command);
  if (has(userAttributes, 'custom:tenantId')) {
    await Promise.all(
      response.Users!.map(async (user: UserType) => {
        filter(user.Attributes, (attribute: AttributeType) => {
          if (attribute.Value === userAttributes['custom:tenantId']) {
            userList.push(user);
          }
        });
      })
    );
    return { Users: userList };
  } else {
    return response;
  }
};

export const adminListGroupsForUsers = async (username: string) => {
  const userPoolId = await getAuth().userPoolId;
  const client = await cognitoClient();
  const command = new AdminListGroupsForUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });
  const response = await client.send(command);
  return response;
};
