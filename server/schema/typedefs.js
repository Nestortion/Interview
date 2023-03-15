const typeDefs = `
    type User {
        id: Int
        first_name: String
        last_name: String
        username: String
        password: String
    }

    type Chat {
        id: Int
        chat_name: String
        other_user_name: String
    }

    type UserGroup {
        id: Int
        chat_id: Int
        user_id: Int
    }

    type UserChat {
        id: Int
        message: String
        chat_id: Int
        user_id: Int
    }

    input createUserInput{
        username: String
        password: String 
        first_name: String
        last_name: String
    }


    type Query{
        users: [User]
        user(user_id: Int): User
        userChats: [UserChat]
        chats:[Chat]
    }

    type Mutation{
        createUser(input: createUserInput): User
        createUserChat(chat_id: Int, message: String): UserChat
        createChat(user_id: Int): Chat
        login(username: String, password: String): User
    }

    type Subscription{
        newMessage(user_id: Int): UserChat
    }

`;

export default typeDefs;
