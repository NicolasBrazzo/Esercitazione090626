import api from "../api/client";

export const fetchRequests = async (filters = {}) => {
  try {
    const res = await api.get("/rimborsi", { params: filters });
    return res.data.requests;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const fetchRequestById = async (id) => {
  try {
    const res = await api.get(`/rimborsi/${id}`);
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const createRequest = async (payload) => {
  try {
    const res = await api.post("/rimborsi", payload);
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const updateRequest = async (id, payload) => {
  try {
    const res = await api.put(`/rimborsi/${id}`, payload);
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const deleteRequest = async (id) => {
  try {
    const res = await api.delete(`/rimborsi/${id}`);
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const approveRequest = async (id) => {
  try {
    const res = await api.put(`/rimborsi/${id}/approva`);
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const rejectRequest = async (id, rejection_reason) => {
  try {
    const res = await api.put(`/rimborsi/${id}/rifiuta`, { rejection_reason });
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const settleRequest = async (id) => {
  try {
    const res = await api.put(`/rimborsi/${id}/liquida`);
    return res.data.request;
  } catch (err) {
    throw new Error(err.message);
  }
};
