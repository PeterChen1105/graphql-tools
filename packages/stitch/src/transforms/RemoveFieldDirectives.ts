import { GraphQLSchema, DirectiveNode } from 'graphql';
import { Transform, matchDirective } from '@graphql-tools/utils';
import { FilterFieldDirectives } from '@graphql-tools/wrap';

export default class RemoveFieldDirectives implements Transform {
  private readonly directiveName: string;
  private readonly directiveArgs: Record<string, any>;

  constructor(directiveName: string, directiveArgs: Record<string, any> = {}) {
    this.directiveName = directiveName;
    this.directiveArgs = directiveArgs;
  }

  public transformSchema(originalSchema: GraphQLSchema): GraphQLSchema {
    const directiveDef = originalSchema.getDirectives().find(directive => directive.name === this.directiveName);

    if (directiveDef === undefined) {
      return originalSchema;
    }

    const transformer = new FilterFieldDirectives(
      (directiveNode: DirectiveNode) => !matchDirective(directiveNode, directiveDef, this.directiveArgs)
    );
    return transformer.transformSchema(originalSchema);
  }
}
