import { useEffect, useState } from "react";
import "./App.css";
import { gql, useMutation, useQuery } from "@apollo/client";
import { setUserId } from "./authStore";

const GET_USERS = gql`
  query Users {
    users {
      id
      first_name
      last_name
      username
      password
    }
  }
`;

const CREATE_CHAT = gql`
  mutation CreateChat($userId: Int) {
    createChat(user_id: $userId) {
      id
      chat_name
    }
  }
`;

const CREATE_USER_CHAT = gql`
  mutation CreateUserChat($chatId: Int, $message: String) {
    createUserChat(chat_id: $chatId, message: $message) {
      id
      message
    }
  }
`;

const GET_CHATS = gql`
  query Chats {
    chats {
      id
      chat_name
      other_user_name
    }
  }
`;

const GET_USERCHATS = gql`
  query UserChats {
    userChats {
      id
      message
      chat_id
      user_id
    }
  }
`;

const USERCHATS_SUBSCRIBE = gql`
  subscription NewMessage($userId: Int) {
    newMessage(user_id: $userId) {
      id
      message
      chat_id
      user_id
    }
  }
`;

const LOGIN = gql`
  mutation Login($username: String, $password: String) {
    login(username: $username, password: $password) {
      id
      first_name
      last_name
      username
      password
    }
  }
`;

function App() {
  const { data, loading, error } = useQuery(GET_USERS);
  const {
    data: chats,
    loading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery(GET_CHATS);
  const {
    data: userChats,
    loading: userChatsLoading,
    error: userChatsError,
    subscribeToMore: userChatsSubscribe,
  } = useQuery(GET_USERCHATS);
  const [login] = useMutation(LOGIN);
  const [createChat] = useMutation(CREATE_CHAT);
  const [createUserChat] = useMutation(CREATE_USER_CHAT);
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState({});
  const [targetUser, setTargetUser] = useState();
  const [selectedChat, setSelectedChat] = useState();
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    userChatsSubscribe({
      document: USERCHATS_SUBSCRIBE,
      variables: { userId: user.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        return {
          userChats: [...prev.userChats, subscriptionData.data.newMessage],
        };
      },
    });
  }, []);

  useEffect(() => {
    const chatHistory = userChats?.userChats?.filter(
      (userchat) => userchat.chat_id === parseInt(selectedChat)
    );
    setChatHistory(chatHistory);
  }, [selectedChat, userChats]);

  useEffect(() => {
    refetchChats();
  }, [user]);

  if (loading) return <h1>Loading...</h1>;
  if (error) return <h1>Error...</h1>;
  if (chatsLoading) return <h1>Loading...</h1>;
  if (chatsError) return <h1>Error...</h1>;
  if (userChatsLoading) return <h1>Loading...</h1>;
  if (userChatsError) return <h1>Error...</h1>;

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await login({ variables: { username, password } });
    setUserId(res.data.login.id);
    setUser(res.data.login);
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();

    await createChat({ variables: { userId: parseInt(targetUser) } });
  };

  const handleCreateUserChat = async (e) => {
    e.preventDefault();

    await createUserChat({
      variables: { chatId: parseInt(selectedChat), message },
    });
  };

  return (
    <div className="App">
      <div className="current-user">Current User: {user.first_name}</div>
      <div className="login">
        Login
        <input onChange={(e) => setUserName(e.target.value)} type="text" />
        <input onChange={(e) => setPassword(e.target.value)} type="password" />
        <button onClick={handleLogin}>Login</button>
      </div>
      <div className="createchat">
        createChat
        <select onChange={(e) => setTargetUser(e.target.value)}>
          {data.users.map((user) => (
            <option key={user.id} value={user.id} id={user.id}>
              {user.first_name}
            </option>
          ))}
        </select>
        <button onClick={handleCreateChat}>create chat</button>
      </div>
      <div className="chatlist">
        chatList
        <div className="chatscontainer">
          {chats.chats.map((chat) => (
            <div
              id={chat.id}
              onClick={(e) => setSelectedChat(e.target.id)}
              key={chat.id}
            >
              {chat.other_user_name}
            </div>
          ))}
        </div>
      </div>
      <div className="chathistory">
        chat History
        <br />
        {chatHistory?.map((chat) => (
          <>
            <span
              className={chat.user_id === user.id ? "you" : "other"}
              key={chat.id}
            >
              {chat.message}
            </span>
          </>
        ))}
      </div>
      <div className="composer">
        <textarea
          onChange={(e) => setMessage(e.target.value)}
          name=""
          id=""
          cols="30"
          rows="10"
        ></textarea>
        <button onClick={handleCreateUserChat}>Send Chat</button>
      </div>
    </div>
  );
}

export default App;
