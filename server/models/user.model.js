const supabase = require("../config/db_connection");

const TABLE_NAME = "RSA_Users";

// get all users 
const findAllUsers = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id, name, surname, email, isAdmin");
  if (error) {
    console.error("FIND ALL USERS SUPABASE ERROR:", error);
    throw new Error(error.message || "DATABASE_FIND_ALL_USERS_ERROR");
  }
  return data;
};

// create new user
const createNewUser = async ( name, surname, email, hashedPassword, isAdmin) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        name,
        surname,
        email,
        password: hashedPassword,
        isAdmin,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_CREATE_USER_ERROR");
  }

  return data;
};

// edit user by id
const updateUserById = async (id, userData) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(userData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_EDIT_USER_ERROR");
  }

  return data;
};

// delete user by id
const deleteUserById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_DELETE_USER_ERROR");
  }

  return data;
};

// find user by email
const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("email", email)
    .maybeSingle();   // .single genera un errore se non trova righe!

  if (error) {
    throw new Error("DATABASE_FIND_USER_ERROR");
  }

  return data; 
};

// find user by id
const findUserById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("DATABASE_FIND_USER_ERROR");
  }

  return data;
};

module.exports = {
  createNewUser,
  findAllUsers,
  findUserByEmail,
  findUserById,
  updateUserById,
  deleteUserById,
};
