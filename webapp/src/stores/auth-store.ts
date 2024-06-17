import { defineStore } from 'pinia';
import { Auth } from 'aws-amplify';
import { get } from 'lodash';
import { Notify } from 'quasar';
import {
  ConfirmSignUpOptions,
  SignUpParams,
} from '@aws-amplify/auth/lib-esm/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false as boolean,
    newPasswordRequired: false as boolean,
  }),
  getters: {
    userEmail: (state) => get(state, ['user', 'attributes', 'email'], 'N/A'),
    userAttributes: (state) => get(state, ['user', 'attributes'], 'N/A'),
    userName: (state) => get(state, ['user', 'username'], 'N/A'),
    userCredentials: (state) => get(state, ['credentials'], null),
    userPoolId: (state) => get(state, ['user', 'pool', 'userPoolId']),
    isAdmin: (state) => {
      const groups = get(state, [
        'user',
        'signInUserSession',
        'accessToken',
        'payload',
        'cognito:groups',
      ]);
      return groups ? groups.includes('admin') : false;
    },
    accessToken: (state) =>
      get(
        state,
        ['user', 'signInUserSession', 'accessToken', 'jwtToken'],
        null
      ),
    exp: (state) => {
      return get(state, [
        'user',
        'signInUserSession',
        'accessToken',
        'payload',
        'exp',
      ]);
    },
  },
  actions: {
    async login(userData: { username: string; password: string }) {
      try {
        const user = await Auth.signIn(userData.username, userData.password);
        if (get(user, 'challengeName') === 'NEW_PASSWORD_REQUIRED') {
          this.newPasswordRequired = true;
        }
        this.user = user;
        this.isAuthenticated = !!user;

        return this.user;
      } catch (error) {
        Notify.create({
          type: 'negative',
          message: `There was an error while executing your login. ${error}`,
        });
      }
    },

    async signOut() {
      await Auth.signOut();
      this.user = null;
      this.isAuthenticated = false;
    },

    async loadUser() {
      try {
        await Auth.currentSession();
        this.user = await Auth.currentAuthenticatedUser();
        if (this.user) {
          this.isAuthenticated = !!this.user;
        }
      } catch (error) {
        console.log(error);
      }
    },

    async register(userData: {
      username: string;
      email: string;
      password: string;
    }) {
      try {
        const payload: SignUpParams = {
          username: userData.username,
          password: userData.password,
          attributes: {
            email: userData.email,
          },
        };
        const user = await Auth.signUp(payload);
        return user;
      } catch (error) {
        console.error(error);
      }
    },

    async confirmRegistration(userData: {
      username: string;
      code: string;
      options?: ConfirmSignUpOptions;
    }) {
      return await Auth.confirmSignUp(
        userData.username,
        userData.code,
        userData?.options
      );
    },

    async setPassword(password: string) {
      const response = await Auth.completeNewPassword(this.user, password);
      this.loadUser();
      this.newPasswordRequired = false;
      return response;
    },
  },
});
