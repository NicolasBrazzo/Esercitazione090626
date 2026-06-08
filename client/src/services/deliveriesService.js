import api from "../api/client";

export const fetchDeliveries = async (filters = {}) => {
  try {
    const res = await api.get("/deliveries", { params: filters });
    return res.data.deliveries;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const fetchDeliveryById = async (id) => {
  try {
    const res = await api.get(`/deliveries/${id}`);
    return res.data.delivery;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const trackDelivery = async (delivery_key, collection_date) => {
  try {
    const res = await api.get("/deliveries/track", {
      params: { delivery_key, collection_date },
    });
    return res.data.track;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const createDelivery = async (payload) => {
  try {
    const res = await api.post("/deliveries", payload);
    return res.data.delivery;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const updateDelivery = async (id, payload) => {
  try {
    const res = await api.put(`/deliveries/${id}`, payload);
    return res.data.delivery;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const deleteDelivery = async (id) => {
  try {
    const res = await api.delete(`/deliveries/${id}`);
    return res.data.delivery;
  } catch (err) {
    throw new Error(err.message);
  }
};
