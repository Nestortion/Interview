import DB from "../config.js";
import Users from "../models/Users.js";
import Chats from "../models/Chats.js";
import { GraphQLError } from "graphql";
import { Op } from "sequelize";
import UserGroups from "../models/UserGroups.js";
import UserChats from "../models/UserChats.js";
import { withFilter } from "graphql-subscriptions";

try {
  await DB.sync();
} catch (error) {
  console.log(error);
}

const resolvers = {
  Chat: {
    other_user_name: async ({ id }, __, { req }) => {
      const userGroups = await UserGroups.findAll({ where: { chat_id: id } });

      const otherUserFilter = userGroups.filter(
        (usergroup) => usergroup.user_id !== parseInt(req.headers.authorization)
      );

      if (otherUserFilter.length === 0) return;
      const otherUser = await Users.findOne({
        where: { id: otherUserFilter[0].user_id },
      });

      if (otherUser) return `${otherUser.first_name} ${otherUser.last_name}`;
    },
  },
  Query: {
    users: async () => {
      return Users.findAll();
    },
    userChats: async () => {
      return UserChats.findAll();
    },
    chats: async (_, __, { req }) => {
      if (!req.headers.cookie) return [];

      const user_id = req.headers.cookie.split("=");

      const userGroups = await UserGroups.findAll({
        where: { user_id: parseInt(user_id[1]) },
      });

      const chatIds = userGroups.map((usergroup) => {
        return usergroup.chat_id;
      });

      const chatList = await Chats.findAll({ where: { id: chatIds } });

      return chatList;
    },
  },
  Mutation: {
    createUser: async (_, { input }) => {
      return Users.create({
        first_name: input.first_name,
        last_name: input.last_name,
        username: input.username,
        password: input.password,
      });
    },
    createUserChat: async (_, { chat_id, message }, { req, pubsub }) => {
      const newUserChat = await UserChats.create({
        chat_id,
        message,
        user_id: parseInt(req.headers.authorization),
      });

      pubsub.publish("NEW_MESSAGE", { newMessage: newUserChat });

      return newUserChat;
    },
    createChat: async (_, { user_id }, { req }) => {
      if (user_id === parseInt(req.headers.authorization)) return;
      const otherUser = await Users.findOne({ where: { id: user_id } });

      const currentUser = await Users.findOne({
        where: { id: parseInt(req.headers.authorization) },
      });

      const checkChat = await Chats.findOne({
        where: {
          [Op.or]: [
            { chat_name: `${otherUser.username}${currentUser.username}` },
            { chat_name: `${currentUser.username}${otherUser.username}` },
          ],
        },
      });

      const userIds = [otherUser.id, currentUser.id];

      if (checkChat) return;

      const newChat = await Chats.create({
        chat_name: `${currentUser.username}${otherUser.username}`,
      });

      await Promise.all(
        userIds.map(async (userid) => {
          await UserGroups.create({ chat_id: newChat.id, user_id: userid });
        })
      );

      return newChat;
    },
    login: async (_, { username, password }, { res, req }) => {
      const user = await Users.findOne({ where: { username, password } });

      if (user) {
        res.cookie("user_id", user.id, { sameSite: "none", secure: true });
        return user;
      } else {
        throw new GraphQLError("Username or Password is incorrect");
      }
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("NEW_MESSAGE"),
        async (payload, variables) => {
          const userGroup = await UserGroups.findOne({
            where: {
              user_id: variables.user_id,
              chat_id: payload.newMessage.chat_id,
            },
          });

          if (userGroup) {
            return true;
          }
          return false;
        }
      ),
    },
  },
};

export default resolvers;
