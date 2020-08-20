import {
  GraphQLDirective,
  GraphQLSchema,
  SchemaDefinitionNode,
  TypeDefinitionNode,
  SchemaExtensionNode,
  TypeExtensionNode,
  GraphQLNamedType,
  GraphQLField,
  GraphQLInputField,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  GraphQLFieldConfig,
  GraphQLInputFieldConfig,
  GraphQLSchemaConfig,
  GraphQLObjectTypeConfig,
  GraphQLInterfaceTypeConfig,
  GraphQLUnionTypeConfig,
  GraphQLScalarTypeConfig,
  GraphQLEnumTypeConfig,
  GraphQLInputObjectTypeConfig,
  GraphQLEnumValue,
  GraphQLEnumValueConfig,
  EnumValueDefinitionNode,
  DirectiveNode,
} from 'graphql';

import { getArgumentValues } from './getArgumentValues';

export type DirectiveUseMap = { [key: string]: any };

type SchemaOrTypeNode =
  | SchemaDefinitionNode
  | SchemaExtensionNode
  | TypeDefinitionNode
  | TypeExtensionNode
  | EnumValueDefinitionNode
  | FieldDefinitionNode
  | InputValueDefinitionNode;

type DirectableGraphQLObject =
  | GraphQLSchema
  | GraphQLSchemaConfig
  | GraphQLNamedType
  | GraphQLObjectTypeConfig<any, any>
  | GraphQLInterfaceTypeConfig<any, any>
  | GraphQLUnionTypeConfig<any, any>
  | GraphQLScalarTypeConfig<any, any>
  | GraphQLEnumTypeConfig
  | GraphQLEnumValue
  | GraphQLEnumValueConfig
  | GraphQLInputObjectTypeConfig
  | GraphQLField<any, any>
  | GraphQLInputField
  | GraphQLFieldConfig<any, any>
  | GraphQLInputFieldConfig;

export function getDirectives(schema: GraphQLSchema, node: DirectableGraphQLObject): DirectiveUseMap {
  const schemaDirectives: ReadonlyArray<GraphQLDirective> =
    schema && schema.getDirectives ? schema.getDirectives() : [];

  const schemaDirectiveMap = schemaDirectives.reduce((schemaDirectiveMap, schemaDirective) => {
    schemaDirectiveMap[schemaDirective.name] = schemaDirective;
    return schemaDirectiveMap;
  }, {});

  const astNodes = getAllASTNodes(node);

  const result: DirectiveUseMap = {};

  astNodes.forEach(astNode => {
    if (astNode.directives) {
      astNode.directives.forEach(directive => {
        const schemaDirective = schemaDirectiveMap[directive.name.value];
        if (schemaDirective) {
          const directiveValue = getDirectiveValues(schemaDirective, astNode);

          if (schemaDirective.isRepeatable) {
            if (result[schemaDirective.name]) {
              result[schemaDirective.name] = result[schemaDirective.name].concat([directiveValue]);
            } else {
              result[schemaDirective.name] = [directiveValue];
            }
          } else {
            result[schemaDirective.name] = directiveValue;
          }
        }
      });
    }
  });

  return result;
}

export function containsDirective(
  node: DirectableGraphQLObject,
  schema: GraphQLSchema,
  directiveName: string,
  directiveArgs: Record<string, any> = {}
): boolean {
  const directiveDef = schema.getDirectives().find(directive => directive.name === directiveName);

  if (directiveDef === undefined) {
    return false;
  }

  const astNodes = getAllASTNodes(node);

  for (const astNode of astNodes) {
    if (astNode.directives) {
      for (const directive of astNode.directives) {
        if (directiveDef.name === directive.name.value) {
          const directiveValueOrValues = getDirectiveValues(directiveDef, astNode);
          if (directiveDef.isRepeatable) {
            for (const directiveValue of directiveValueOrValues) {
              if (directiveArgs === undefined || deepEquals(directiveValue, directiveArgs)) {
                return true;
              }
            }
          } else {
            if (directiveArgs === undefined || deepEquals(directiveValueOrValues, directiveArgs)) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

export function matchDirective(
  directiveNode: DirectiveNode,
  directiveDef: GraphQLDirective,
  directiveArgs: Record<string, any> = {}
): boolean {
  if (directiveDef.name === directiveNode.name.value) {
    if (directiveArgs === undefined) {
      return true;
    }
    const directiveArgumentValues = getArgumentValues(directiveDef, directiveNode);
    if (deepEquals(directiveArgumentValues, directiveArgs)) {
      return true;
    }
  }
  return false;
}

// graphql-js getDirectiveValues does not handle repeatable directives
function getDirectiveValues(directiveDef: GraphQLDirective, node: SchemaOrTypeNode): any {
  if (node.directives) {
    if (directiveDef.isRepeatable) {
      const directiveNodes = node.directives.filter(directive => directive.name.value === directiveDef.name);

      return directiveNodes.map(directiveNode => getArgumentValues(directiveDef, directiveNode));
    }

    const directiveNode = node.directives.find(directive => directive.name.value === directiveDef.name);

    return getArgumentValues(directiveDef, directiveNode);
  }
}

function getAllASTNodes(node: DirectableGraphQLObject): Array<SchemaOrTypeNode> {
  let astNodes: Array<SchemaOrTypeNode> = [];

  if (node.astNode) {
    astNodes.push(node.astNode);
  }

  if ('extensionASTNodes' in node && node.extensionASTNodes) {
    astNodes = astNodes.concat(node.extensionASTNodes);
  }

  return astNodes;
}

function deepEquals(object: any, pattern: any): boolean {
  if (Array.isArray(pattern)) {
    if (!Array.isArray(object)) {
      return false;
    }
    return pattern.every((value, index) => deepEquals(object[index], value));
  } else if (typeof pattern === 'object') {
    if (object == null) {
      return false;
    }
    return Object.keys(pattern).every(propertyName => deepEquals(object[propertyName], pattern[propertyName]));
  }
  return object === pattern;
}
