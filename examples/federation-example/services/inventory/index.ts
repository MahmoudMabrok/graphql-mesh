import { buildSubgraphSchema } from '@apollo/subgraph';
import type { GraphQLResolverMap } from '@apollo/subgraph/dist/schema-helper';
import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers: GraphQLResolverMap<any> = {
  Product: {
    __resolveReference(object) {
      return {
        ...object,
        ...inventory.find(product => product.upc === object.upc),
      };
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([
    {
      typeDefs,
      resolvers,
    },
  ]),
});

export default {
  async start() {
    return server.listen({ port: 9872 }).then(({ url }) => {
      if (!process.env.CI) {
        console.log(`🚀 Server ready at ${url}`);
      }
      return;
    });
  },
  async stop() {
    return server.stop();
  },
};

const inventory = [
  { upc: '1', inStock: true },
  { upc: '2', inStock: false },
  { upc: '3', inStock: true },
];
