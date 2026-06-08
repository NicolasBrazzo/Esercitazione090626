import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PrivateRoute } from "./api/components/PrivateRoute.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Clients } from "./pages/Clients.jsx";
import { Deliveries } from "./pages/Deliveries.jsx";
import { Users } from "./pages/Users.jsx";
import { DeliveryTrack } from "./pages/DeliveryTrack.jsx";

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/delivery-track" element={<DeliveryTrack />} />
              <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/deliveries" element={<Deliveries />} /> 
                  <Route path="/users" element={<Users />} /> 
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
      <ToastContainer />
    </>
  );
}

export default App;
