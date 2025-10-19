import { useUser } from "@/app/handlers/UserProvider";
import { addHfToken as apiAdd, deleteHfToken as apiDelete } from "@/app/types/tokens";
import toast from "react-hot-toast";

export const useHfTokens = () => {
  const { user, setUser } = useUser();

  const addToken = async (token: string) => {
    if (!token.trim()) return;

    try {
      const updatedTokens = await apiAdd(token.trim());
      setUser(prev => prev ? { ...prev, hf_token: [...updatedTokens] } : null);
      toast.success("HF Token added!");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to add HF token");
      toast.error(error.message);
    }
  };

  const deleteToken = async (token: string) => {
    try {
      const updatedTokens = await apiDelete(token);
      setUser(prev => prev ? { ...prev, hf_token: [...updatedTokens] } : null);
      toast.success("HF Token deleted!");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to delete HF token");
      toast.error(error.message);
    }
  };

  const listHfTokens = () => user?.hf_token ?? [];

  return { user, addToken, deleteToken, listHfTokens };
};
