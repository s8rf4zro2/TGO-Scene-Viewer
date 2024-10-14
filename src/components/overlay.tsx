import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "preact/hooks";

export default function VideoOverlay({
  videos,
  currentSceneIndex,
  totalScenes,
  nextScene,
  prevScene,
}: {
  videos: string[];
  currentSceneIndex: number;
  totalScenes: number;
  nextScene: () => void;
  prevScene: () => void;
}) {
  const [src, setSrc] = useState("");
  const [loopScene, setLoopScene] = useState(false);
  const [loopPart, setLoopPart] = useState(false);
  const [play, setPlay] = useState("");
  const open = !!play;

  useEffect(() => {
    if (videos && videos.length > 0) {
      setPlay(videos[0]);
    }
  }, [videos]);

  useEffect(() => {
    (async () => {
      if (!play) {
        return;
      }

      const filePath = await invoke<string>("get_video", { filename: play });

      if (!filePath) {
        return;
      }

      const fileSrc = await convertFileSrc(filePath);

      setSrc(fileSrc);
    })();
  }, [play]);

  if (!open) return null;

  const close = () => {
    setPlay("");
  };

  const handleLoopScene = () => {
    if (loopPart) {
      setLoopPart(false);
    }

    setLoopScene(!loopScene);
  };

  const handleLoopPart = () => {
    if (loopScene) {
      setLoopScene(false);
    }

    setLoopPart(!loopPart);
  };

  const handleNextPart = () => {
    const index = videos.indexOf(play);

    if (index === videos.length - 1) {
      setPlay(videos[0]);
    } else {
      setPlay(videos[index + 1]);
    }
  };

  const handlePreviousPart = () => {
    const index = videos.indexOf(play);

    if (index === 0) {
      setPlay(videos[videos.length - 1]);
    } else {
      setPlay(videos[index - 1]);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 max-h-screen">
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-md"></div>
      <div className="relative bg-opacity-80 backdrop-blur-lg p-6 rounded-lg shadow-lg w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
        <button
          className="absolute top-2 right-2 text-black bg-gray-200 rounded-full p-2 hover:bg-gray-300 h-10 w-10 z-[9999]"
          onClick={close}
        >
          ✕
        </button>
        <div className="flex-grow overflow-y-auto">
          {src ? (
            <div className="flex flex-col h-full">
              <video
                className="w-full h-auto max-h-[60vh] rounded-lg mt-2 object-contain"
                src={src}
                controls
                autoPlay
                onEnded={() => loopScene && handleNextPart()}
                loop={loopPart}
              />

              <div className="mt-4 flex flex-col gap-4">
                <p className="text-center">
                  Scene {currentSceneIndex + 1} of {totalScenes} - Part{" "}
                  {videos.indexOf(play) + 1} of {videos.length}
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={prevScene}
                  >
                    Previous Scene
                  </button>
                  <button
                    className="btn btn-accent btn-sm"
                    onClick={handlePreviousPart}
                  >
                    Previous Part
                  </button>
                  <button
                    className={`btn btn-sm ${loopPart ? "btn-secondary" : ""}`}
                    onClick={handleLoopPart}
                  >
                    Loop Part
                  </button>
                  <button
                    className={`btn btn-sm ${loopScene ? "btn-secondary" : ""}`}
                    onClick={handleLoopScene}
                  >
                    Loop Scene
                  </button>
                  <button
                    className="btn btn-accent btn-sm"
                    onClick={handleNextPart}
                  >
                    Next Part
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={nextScene}
                  >
                    Next Scene
                  </button>
                </div>
                <div className="flex justify-center mt-2">
                  <select
                    className="select select-secondary select-sm w-full max-w-xs"
                    value={play}
                    onChange={(e) => setPlay(e.currentTarget.value)}
                  >
                    <option disabled value="">
                      Select Part
                    </option>
                    {videos.map((video) => (
                      <option key={video} value={video}>
                        {video}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="skeleton h-64 w-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
