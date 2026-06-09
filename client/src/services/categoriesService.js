import api from "../api/client";

export const fetchCategories = async () => {
  try {
    const res = await api.get("/categorie-spesa");
    return res.data.categories;
  } catch (err) {
    throw new Error(err.message);
  }
};
