const supabase = require("../config/db_connection");

// Find All Deliveries (with optional filters)
const findAllDeliveries = async (filters = {}) => {
  let query = supabase.from("ECE_Deliveries").select("*");

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.client_id) {
    query = query.eq("client_id", filters.client_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("DATABASE_FIND_ALL_DELIVERIES_ERROR");
  }
  return data;
};

// Find Delivery by ID
const findDeliveryById = async (id) => {
  const { data, error } = await supabase
    .from("ECE_Deliveries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("DATABASE_FIND_DELIVERY_ERROR");
  }

  return data;
};

// Create Delivery
const createDelivery = async (
  client_id,
  collection_date,
  delivery_date,
  delivery_key,
  status
) => {
  const { data, error } = await supabase
    .from("ECE_Deliveries")
    .insert([
      {
        client_id,
        collection_date,
        delivery_date,
        delivery_key,
        status,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_CREATE_DELIVERY_ERROR");
  }

  return data;
};

// Update Delivery by ID
const updateDeliveryById = async (id, deliveriesData) => {
  const { data, error } = await supabase
    .from("ECE_Deliveries")
    .update(deliveriesData)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error("DATABASE_UPDATE_DELIVERY_ERROR");
  }
  return data;
};

// Delete Delivery by ID
const deleteDeliveryById = async (id) => {
  const { data, error } = await supabase
    .from("ECE_Deliveries")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_DELETE_DELIVERY_ERROR");
  }

  return data;
};

// Find Delivery by Delivery Key
const findDeliveryByDeliveryKey = async (delivery_key) => {
  const { data, error } = await supabase
    .from("ECE_Deliveries")
    .select("*")
    .eq("delivery_key", delivery_key)
    .maybeSingle();

  if (error) {
    throw new Error("DATABASE_FIND_DELIVERY_ERROR");
  }

  return data;
};

// Find Delivery by Delivery Key and Collection Date
const findDeliveryByDeliveryKeyAndCollectionDate = async (
  delivery_key,
  collection_date,
) => {
  const { data, error } = await supabase
    .from("ECE_Deliveries")
    .select("*")
    .eq("delivery_key", delivery_key)
    .eq("collection_date", collection_date)
    .maybeSingle();

  if (error) {
    throw new Error("DATABASE_FIND_DELIVERY_ERROR");
  }

  return data;
};

module.exports = {
  findAllDeliveries,
  findDeliveryById,
  createDelivery,
  updateDeliveryById,
  deleteDeliveryById,
  findDeliveryByDeliveryKey,
  findDeliveryByDeliveryKeyAndCollectionDate,
};
