const supabase = require("../config/db_connection");

const TABLE_NAME = "RSA_ExpenseCategory";

// Find All Expense Categories
const findAllExpenseCategories = async () => {
  const { data, error } = await supabase.from(TABLE_NAME).select("*");

  if (error) {
    throw new Error("DATABASE_FIND_ALL_EXPENSE_CATEGORIES_ERROR");
  }
  return data;
};

module.exports = {
  findAllExpenseCategories,
};
