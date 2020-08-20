import { GraphQLSchema, GraphQLFieldConfig } from 'graphql';
import { Transform, containsDirective } from '@graphql-tools/utils';
import { FilterObjectFields } from '@graphql-tools/wrap';

export default class RemoveFieldsWithDirective implements Transform {
  private readonly directiveName: string;
  private readonly directiveArgs: Record<string, any>;

  constructor(directiveName: string, directiveArgs: Record<string, any> = {}) {
    this.directiveName = directiveName;
    this.directiveArgs = directiveArgs;
  }

  public transformSchema(originalSchema: GraphQLSchema): GraphQLSchema {
    const transformer = new FilterObjectFields(
      (_typeName: string, _fieldName: string, fieldConfig: GraphQLFieldConfig<any, any>) => {
        return !containsDirective(fieldConfig, originalSchema, this.directiveName, this.directiveArgs);
      }
    );
    return transformer.transformSchema(originalSchema);
  }
}
