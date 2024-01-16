type Env = {
  account?: string;
  region?: string;
};

export const config = (overrideProps?: Env) => {
  const account =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    overrideProps!.account || process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;

  const region =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    overrideProps!.region || process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION;

  if (!account || !region) {
    throw new Error('Wrong config');
  }
  return { account, region };
};
