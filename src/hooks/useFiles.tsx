import { useEffect, useState } from "preact/hooks";
import { getVideos } from "../lib/video-utils";
import useSetup from "./useSetup";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const defaultFlags = [
  { value: "nsfw", label: "NSFW" },
  { value: "sfw", label: "SFW" },
  { value: "bc1", label: "Booty Calls" },
  { value: "bc2", label: "Booty Calls Alt" },
  { value: "ps", label: "Porn Shop" },
  { value: "profiles", label: "Profiles" },
  { value: "other", label: "Other" },
];

export default function useFiles(flags: string[]) {
  const { gameDir } = useSetup();
  const [files, setFiles] = useState<Record<string, string[]> | null>(null);
  const [path, setPath] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string>();

  useEffect(() => {
    async function loadFiles() {
      if (gameDir) {
        try {
          const files = await getVideos(flags);
          if (!files) {
            throw new Error("No files found");
          }
          setPath(files.path);
          setFiles(files.scenes);
        } catch (err) {
          console.error("Error loading files:", err);
        }
      }
    }
    loadFiles();
  }, [gameDir, flags]);

  useEffect(() => {
    async function initializeThumbnails() {
      if (!files) return;

      try {
        const keys = Object.keys(files);

        if (!keys.length) {
          setLoading(false);
          return;
        }

        const filenames = keys.map((key) => files[key][0]);

        const thumbnails = await invoke<string[]>("generate_thumbnails", {
          filenames,
        });

        setThumbnails(thumbnails);
      } catch (err) {
        console.error("Error initializing thumbnails:", err);
        setLoading(false);
      }
    }

    initializeThumbnails();
  }, [files]);

  useEffect(() => {
    let unlistenProgress: UnlistenFn | null = null;
    let unlistenComplete: UnlistenFn | null = null;

    async function setupEventListeners() {
      try {
        unlistenProgress = await listen<any>(
          "thumbnail_generation_progress",
          (event) => {
            const { total, completed, current_file } = event.payload;
            setCurrentFile(current_file);
            setProgress(Math.ceil((completed / total) * 100));
          }
        );

        unlistenComplete = await listen(
          "thumbnail_generation_complete",
          async () => {
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error setting up event listeners:", err);
      }
    }

    setupEventListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenComplete) unlistenComplete();
    };
  }, []);

  return {
    files,
    loading,
    progress,
    path,
    defaultFlags,
    thumbnails,
    currentFile,
  };
}
