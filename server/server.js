import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { expressMiddleware } from "@apollo/server/express4";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { ApolloServer } from "@apollo/server";
import typeDefs from "./schema/typeDefs.js";
import resolvers from "./schema/resolvers.js";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";

dotenv.config();

const app = express();
const pubsub = new PubSub();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const schema = makeExecutableSchema({ typeDefs, resolvers });
const serverCleanup = useServer(
  {
    schema,
    context: ({ req, res }) => ({
      req,
      res,
      pubsub,
    }),
  },
  wsServer
);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

app.use(
  "/graphql",
  cors({
    credentials: true,
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  }),
  json(),
  expressMiddleware(server, {
    context: ({ req, res }) => {
      return { req, res, pubsub };
    },
  })
);

httpServer.listen(4000, () => {
  console.log(`listening to PORT ${4000}`);
});
