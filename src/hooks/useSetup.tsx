import { useState, useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export default function useSetup() {
  const [gameDir, setGameDir] = useState<string | null>(null);

  const handleFolder = async () => {
    const folder = await open({
      multiple: false,
      directory: true,
    });

    if (!folder) {
      return;
    }

    await invoke<boolean>("handle_folder", { path: folder });

    setGameDir(folder);
  };

  useEffect(() => {
    (async () => {
      const game_dir = await invoke<string>("get_game_dir");

      if (game_dir) {
        setGameDir(game_dir);
        return;
      }

      await handleFolder();
    })();
  }, []);

  return {
    handleFolder,
    gameDir,
  };
}
