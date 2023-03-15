let user_id = "";

const setUserId = (id) => {
  user_id = id;
};

const getUserId = () => {
  return user_id;
};

export { setUserId, getUserId };
