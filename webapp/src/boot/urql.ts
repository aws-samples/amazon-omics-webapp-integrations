import { boot } from 'quasar/wrappers';
import {
  ClientOptions,
  createClient,
  defaultExchanges,
  errorExchange,
} from '@urql/vue';
import { useAuthStore } from 'src/stores/auth-store';
import { devtoolsExchange } from '@urql/devtools';
import { authExchange } from '@urql/exchange-auth';
import { makeOperation } from '@urql/core';
import { Notify } from 'quasar';

import urql from '@urql/vue';
import { Auth } from 'aws-amplify';

export default boot(({ app }) => {
  const auth = useAuthStore();
  const clientConfig: ClientOptions = {
    url: import.meta.env.VITE_GRAPHQL_URL,
    requestPolicy: 'cache-and-network',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addAuthToOperation = ({ authState, operation }: any) => {
    if (!authState || !authState.token) {
      return operation;
    }
    const fetchOptions =
      typeof operation.context.fetchOptions === 'function'
        ? operation.context.fetchOptions()
        : operation.context.fetchOptions || {};

    return makeOperation(operation.kind, operation, {
      ...operation.context,
      fetchOptions: {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: authState.token,
        },
      },
    });
  };

  const getAuth = async () => {
    if (!auth.isAuthenticated) return;
    const token = (await Auth.currentSession()).getIdToken().getJwtToken();
    if (token) {
      return { token };
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const willAuthError = ({ authState }: any) => {
    const expired = auth.exp < Date.now() / 1000 - 30;
    if (!authState || expired || !auth.isAuthenticated) return true;
    return false;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exchanges: Array<any> = [
    authExchange({
      willAuthError,
      getAuth,
      addAuthToOperation,
    }),
    errorExchange({
      onError(error) {
        Notify.create({
          type: 'negative',
          position: 'center',
          message: error.message,
        });

        console.error(error);
      },
    }),
  ];
  if (import.meta.env.DEV) {
    exchanges.push(devtoolsExchange);
  }
  exchanges.push(...defaultExchanges);

  clientConfig.exchanges = exchanges;

  const client = createClient(clientConfig);
  app.use(urql, client);
});
