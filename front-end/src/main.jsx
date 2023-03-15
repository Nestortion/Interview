import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ApolloProvider,
  InMemoryCache,
  ApolloClient,
  ApolloLink,
  split,
  HttpLink,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getUserId } from "./authStore";

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => {
    const accessToken = getUserId();
    return {
      headers: {
        ...headers,
        authorization: accessToken,
        "Apollo-Require-Preflight": "true",
      },
    };
  });

  return forward(operation);
});

const graphqlLink = new HttpLink({
  uri: `http://localhost:4000/graphql`,
  credentials: "include",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `ws://localhost:4000/graphql`,
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  ApolloLink.from([authLink, graphqlLink])
);

const cache = new InMemoryCache();

const client = new ApolloClient({
  link: splitLink,
  cache,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
