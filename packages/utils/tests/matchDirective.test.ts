import { matchDirective } from '../src/get-directives';
import { GraphQLDirective, DirectiveLocation, DirectiveNode, Kind, GraphQLString } from 'graphql';

describe('matchDirective', () => {
  test('matches a directive node based on flexible criteria', () => {
    const directiveNode: DirectiveNode = {
      kind: Kind.DIRECTIVE,
      name: { kind: Kind.NAME, value: 'customDeprecated' },
      arguments: [{
        kind: Kind.ARGUMENT,
        name: { kind: Kind.NAME, value: 'reason' },
        value: {
          kind: Kind.STRING,
          value: 'reason',
        }
      }, {
        kind: Kind.ARGUMENT,
        name: { kind: Kind.NAME, value: 'also' },
        value: {
          kind: Kind.STRING,
          value: 'also',
        }
      }]
    };

    const notTheDirective = new GraphQLDirective({ name: 'notthis', locations: [DirectiveLocation.FIELD] });
    const customDeprecatedDirective = new GraphQLDirective({
      name: 'customDeprecated',
      locations: [DirectiveLocation.FIELD],
      args: {
        reason: {
          type: GraphQLString,
        },
        also: {
          type: GraphQLString,
        },
        and: {
          type: GraphQLString,
        },
        this: {
          type: GraphQLString,
        },
      }
    });

    expect(matchDirective(directiveNode, notTheDirective)).toBe(false);
    expect(matchDirective(directiveNode, customDeprecatedDirective)).toBe(true);
    expect(matchDirective(directiveNode, customDeprecatedDirective, { reason: 'reason' })).toBe(true);
    expect(matchDirective(directiveNode, customDeprecatedDirective, { reason: 'reason', also: 'also' })).toBe(true);
    expect(matchDirective(directiveNode, customDeprecatedDirective, { reason: 'reason', and: 'and' })).toBe(false);
    expect(matchDirective(directiveNode, customDeprecatedDirective, { this: 'this' })).toBe(false);
  });
});
