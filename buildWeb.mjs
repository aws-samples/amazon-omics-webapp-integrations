import * as infraConfig from './cdk-infra-outputs.json' assert { type: 'json' };
import * as cdkJson from './cdk.json' assert { type: 'json' };
import lodash from 'lodash';
import { writeFile } from 'fs';
const { map, get } = lodash;
// const envFile = '../omics-demo-app/.env';
const envFile = './webapp/.env';

let deployAlias;
export const initProcess = async () => {
  const stage = cdkJson.default.context.stage;
  const context = cdkJson.default.context[stage];
  deployAlias = `${context.alias}-${stage}-${context.appName}-infraStack`;
  await writeFile(envFile, '', { flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};
export const appendValue = async (data) => {
  await writeFile(envFile, data, { flag: 'a' }, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

export const buildWeb = () => {
  initProcess();
  map(infraConfig, (value) => {
    appendValue(`VITE_COGNITO_REGION=${get(value[deployAlias], 'cognitoregion')}\n`);
    appendValue(`VITE_COGNITO_USERPOOLID=${get(value[deployAlias], 'userpoolid')}\n`);
    appendValue(`VITE_COGNITO_IDENTITYPOOLID=${get(value[deployAlias], 'identitypoolid')}\n`);
    appendValue(`VITE_COGNITO_WEBCLIENTID=${get(value[deployAlias], 'userpoolclientid')}\n`);
    appendValue(`VITE_GRAPHQL_URL=${get(value[deployAlias], 'graphqlurl')}\n`);
  });
};

buildWeb();

//
