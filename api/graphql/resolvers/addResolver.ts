import { LambdaDataSource, MappingTemplate } from 'aws-cdk-lib/aws-appsync';
import { resolverSet } from './resolverConfig';

const templatePath = './api/graphql/resolvers';
export function addResolver(datasource: LambdaDataSource, resolverConfig: resolverSet[]) {
  resolverConfig.map((resolver, id) => {
    const config = {
      typeName: resolver.type,
      fieldName: resolver.field,
      requestMappingTemplate: MappingTemplate.fromFile(
        `${templatePath}/requests/${resolver.requestTemplate}`
      ),
      responseMappingTemplate: MappingTemplate.fromFile(`${templatePath}/responses/default.vtl`),
    };
    datasource.createResolver(`${id}-${resolver.field}`, config);
  });
}
