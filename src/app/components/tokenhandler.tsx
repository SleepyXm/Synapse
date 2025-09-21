import { useUser } from "./UserProvider";
import { addHfToken as apiAdd, deleteHfToken as apiDelete } from "./auth";
import toast from "react-hot-toast";

export const useHfTokens = () => {
  const { user, setUser } = useUser();

  const addToken = async (token: string) => {
    if (!token.trim()) return;
    try {
      const updatedTokens = await apiAdd(token.trim());
      setUser(prev => prev ? { ...prev, hf_token: [...updatedTokens] } : null);
      toast.success("HF Token added!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteToken = async (token: string) => {
    try {
      const updatedTokens = await apiDelete(token);
      setUser(prev => prev ? { ...prev, hf_token: [...updatedTokens] } : null);
      toast.success("HF Token deleted!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return { user, addToken, deleteToken };
};