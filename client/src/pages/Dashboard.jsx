import { useAuth } from "../context/AuthContext";
// import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// import { Truck, Users, UserCog, MapPin, ArrowRight } from "lucide-react";

// import { fetchClients } from "../services/clientsService";
// import { fetchDeliveries } from "../services/deliveriesService";
// import { fetchUsers } from "../services/userService";
// import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  // const navigate = useNavigate();

  console.log(user)

  return (
    <div>
      Al momento vuota { user?.email}
    </div>
  )
};
