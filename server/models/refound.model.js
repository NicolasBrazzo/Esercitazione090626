const supabase = require("../config/db_connection");

const TABLE_NAME = "RSA_RefoundRequest";

// ONLY ADMIN
// Find All Refound Requests (with optional filters)
const findAllRefoundRequests = async (filters = {}) => {
  let query = supabase.from(TABLE_NAME).select("*");

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.employee_id) {
    query = query.eq("employee_id", filters.employee_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("DATABASE_FIND_ALL_REFUND_REQUESTS_ERROR");
  }
  return data;
};

// Find Refound Request by ID
const findRefoundRequestById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("DATABASE_FIND_REFUND_REQUEST_ERROR");
  }

  return data;
};

// Create Refound Request
const createRefoundRequest = async (
  submission_date,
  expense_date,
  category_id,
  amount,
  description,
  receipt_reference,
  status,
  employee_id,
  evaluation_date,
  admin_id,
  rejection_reason,
  settlement_date
) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        submission_date,
        expense_date,
        category_id,
        amount,
        description,
        receipt_reference,
        status,
        employee_id,
        evaluation_date,
        admin_id,
        rejection_reason,
        settlement_date
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_CREATE_DELIVERY_ERROR");
  }

  return data;
};

// Update Refound Request by ID
const updateRefoundRequestById = async (id, refoundData) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(refoundData)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw new Error("DATABASE_UPDATE_REFUND_REQUEST_ERROR");
  }
  return data;
};

// Delete Refound Request by ID
const deleteRefoundRequestById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("DATABASE_DELETE_REFUND_REQUEST_ERROR");
  }

  return data;
};


module.exports = {
  findAllRefoundRequests,
  findRefoundRequestById,
  createRefoundRequest,
  updateRefoundRequestById,
  deleteRefoundRequestById,
};
