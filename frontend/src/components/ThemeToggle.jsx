import { Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function ThemeToggle() {
  const { user, updateSettings } = useAuth();

  return (
    <button
      className="btn-secondary px-3"
      onClick={() => updateSettings({ darkMode: !user.darkMode })}
      aria-label="Переключить тему"
    >
      {user?.darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
