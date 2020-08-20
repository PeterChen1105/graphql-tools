import { GraphQLSchema, GraphQLFieldConfig, DirectiveNode } from 'graphql';
import { Transform } from '@graphql-tools/utils';
import TransformObjectFields from './TransformObjectFields';

export default class FilterFieldDirectives implements Transform {
  private readonly filter: (directiveNode: DirectiveNode) => boolean;

  constructor(filter: (directiveNode: DirectiveNode) => boolean) {
    this.filter = filter;
  }

  public transformSchema(originalSchema: GraphQLSchema): GraphQLSchema {
    const transformer = new TransformObjectFields(
      (_typeName: string, _fieldName: string, fieldConfig: GraphQLFieldConfig<any, any>) => {
        const keepDirectives = fieldConfig.astNode.directives.filter(directiveNode => this.filter(directiveNode));

        if (keepDirectives.length !== fieldConfig.astNode.directives.length) {
          fieldConfig = {
            ...fieldConfig,
            astNode: {
              ...fieldConfig.astNode,
              directives: keepDirectives,
            },
          };

          if (fieldConfig.deprecationReason && !keepDirectives.some(dir => dir.name.value === 'deprecated')) {
            delete fieldConfig.deprecationReason;
          }
          return fieldConfig;
        }
      }
    );

    return transformer.transformSchema(originalSchema);
  }
}
