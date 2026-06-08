const supabase = require("../config/db_connection");

// Find All Clients
const findAllClients = async () => {
  const { data, error } = await supabase.from("ECE_Clients").select("*");

  if (error) {
    throw new Error("DATABASE_FIND_ALL_CLIENTS_ERROR");
  }
  return data;
};

// Find Client by Email
const findClientByEmail = async (email) => {
  const { data, error } = await supabase
    .from("ECE_Clients")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    throw new Error("DATABASE_FIND_CLIENT_BY_EMAIL_ERROR");
  }

  return data;
};

// Find Client by ID
const findClientById = async (id) => {
  const { data, error } = await supabase
    .from("ECE_Clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("DATABASE_FIND_CLIENT_ERROR");
  }

  return data;
};

// Create Client
const createClient = async (
  name,
  via,
  comune,
  provincia,
  phone,
  email,
  note,
) => {
  const { data, error } = await supabase
    .from("ECE_Clients")
    .insert([
      {
        name,
        via,
        comune,
        provincia,
        phone,
        email,
        note,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_CREATE_CLIENT_ERROR");
  }

  return data;
};

// Update Client by ID
const updateClientById = async (id, clientsData) => {
  const { data, error } = await supabase
    .from("ECE_Clients")
    .update(clientsData)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error("DATABASE_UPDATE_CLIENT_ERROR");
  }
  return data;
};

// Delete Client by ID
const deleteClientById = async (id) => {
  const { data, error } = await supabase
    .from("ECE_Clients")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_DELETE_CLIENT_ERROR");
  }

  return data;
};

module.exports = {
  findAllClients,
  findClientByEmail,
  findClientById,
  createClient,
  updateClientById,
  deleteClientById,
};
