import { useEffect, useState } from "react";
import "./App.css";
import { gql, useMutation, useQuery } from "@apollo/client";
import { getUserId, setUserId } from "./authStore";

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
      sender_name
    }
  }
`;

const CHATS_SUBSCRIBE = gql`
  subscription NewChat($userId: Int) {
    newChat(user_id: $userId) {
      id
      chat_name
      other_user_name
    }
  }
`;

const LOGOUT = gql`
  mutation Mutation {
    logout
  }
`;

const USERCHATS_SUBSCRIBE = gql`
  subscription NewMessage($userId: Int) {
    newMessage(user_id: $userId) {
      id
      message
      chat_id
      user_id
      sender_name
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
    subscribeToMore: chatsSubscribe,
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
  const [logout] = useMutation(LOGOUT);
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState({});
  const [targetUser, setTargetUser] = useState();
  const [selectedChat, setSelectedChat] = useState();
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [notifications, setNofications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    userChatsSubscribe({
      document: USERCHATS_SUBSCRIBE,
      variables: { userId: user.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        if (subscriptionData.data.newMessage.user_id !== user.id) {
          setNofications((prev) => [
            ...prev,
            `you have a message from ${subscriptionData.data.newMessage.sender_name}`,
          ]);
        }
        refetchChats();
        return {
          userChats: [...prev.userChats, subscriptionData.data.newMessage],
        };
      },
    });
    chatsSubscribe({
      document: CHATS_SUBSCRIBE,
      variables: { userId: user.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        return { chats: [...prev.chats, subscriptionData.data.newChat] };
      },
    });
  }, [user]);

  useEffect(() => {
    const chatHistory = userChats?.userChats?.filter(
      (userchat) => userchat.chat_id === parseInt(selectedChat)
    );
    setChatHistory(chatHistory);
  }, [selectedChat, userChats]);

  useEffect(() => {
    setUserId(user.id);
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
    setUserName("");
    setPassword("");
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
    setMessage("");
  };

  const handleViewNotif = (e) => {
    e.preventDefault();

    setShowNotif(!showNotif);
    if (showNotif === true) {
      setNofications([]);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    await logout();
    window.location.reload(true);
  };

  return (
    <div className="App">
      <div className="current-user">
        Current User: {user.first_name}
        <div
          onClick={handleViewNotif}
          className={`notification-container ${
            notifications.length > 0 ? "notify" : "no-notif"
          }`}
        >
          notifications {notifications.length}
          {showNotif && (
            <div className="notification-list">
              {notifications.map((notification, index) => (
                <span key={index}>{notification}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="login">
        <span>Login</span>
        <div className="login-input">
          <input
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            type="text"
            placeholder="Username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
        </div>
        <button onClick={handleLogin}>Login</button>
        <button className="danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="createchat">
        <button onClick={handleCreateChat}>create chat</button>
        <select onChange={(e) => setTargetUser(e.target.value)}>
          {data.users.map(
            (userx) =>
              userx.id !== user.id && (
                <option key={userx.id} value={userx.id} id={userx.id}>
                  {userx.first_name}
                </option>
              )
          )}
        </select>
      </div>
      <div className="chatlist">
        <div className="chatscontainer">
          {user.id &&
            chats.chats?.map(
              (chat) =>
                chat !== "" && (
                  <div
                    id={chat.id}
                    onClick={(e) => setSelectedChat(e.target.id)}
                    key={chat.id}
                  >
                    {chat.other_user_name}
                  </div>
                )
            )}
        </div>
      </div>
      <div className="chathistory">
        <br />
        {chatHistory?.map((chat) => (
          <div
            className={chat.user_id === user.id ? "you" : "other"}
            key={chat.id}
          >
            <div className="userchat-container">
              <div className="sender">
                {chat.user_id !== user.id && chat.sender_name}
              </div>
              <div className="message">{chat.message}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="composer">
        <textarea
          onChange={(e) => setMessage(e.target.value)}
          name=""
          value={message}
          id=""
          cols="30"
          rows="10"
        ></textarea>
        <button className="send-button" onClick={handleCreateUserChat}>
          Send Chat
        </button>
      </div>
    </div>
  );
}

export default App;
