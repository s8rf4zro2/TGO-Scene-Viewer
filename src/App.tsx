import "./App.css";
import Overlay from "./components/overlay";
import Thumbnail from "./components/thumbnail";
import useFiles from "./hooks/useFiles";
import { useState } from "preact/compat";
import Loader from "./components/loader";

function App() {
  const [flags, setFlags] = useState<string[]>(["nsfw"]);
  const {
    files,
    path,
    defaultFlags,
    loading,
    progress,
    thumbnails,
    currentFile,
  } = useFiles(flags);
  const [key, setKey] = useState("");

  const nextScene = () => {
    if (!files) {
      return;
    }

    const keys = Object.keys(files);
    const index = keys.indexOf(key);

    if (index === keys.length - 1) {
      setKey(keys[0]);
    } else {
      setKey(keys[index + 1]);
    }
  };

  const prevScene = () => {
    if (!files) {
      return;
    }

    const keys = Object.keys(files);

    const index = keys.indexOf(key);
    if (index === 0) {
      setKey(keys[keys.length - 1]);
    } else {
      setKey(keys[index - 1]);
    }
  };

  return !files || !path || loading || !thumbnails ? (
    <Loader currentFile={currentFile} progress={progress} />
  ) : (
    <>
      <Overlay
        videos={files![key]}
        currentSceneIndex={Object.keys(files!).indexOf(key)}
        totalScenes={Object.keys(files!).length}
        nextScene={nextScene}
        prevScene={prevScene}
      />

      <div className="flex justify-center mt-10">
        <div className="join join-vertical lg:join-horizontal">
          {defaultFlags.map((flag) => (
            <button
              key={flag}
              className={`btn join-item ${
                flags.includes(flag.value) ? "btn-accent" : ""
              }`}
              onClick={() => {
                if (flags.length === 1 && flags.includes(flag.value)) {
                  return;
                }

                if (flags.includes(flag.value)) {
                  setFlags(flags.filter((f) => f !== flag.value));
                } else {
                  setFlags([...flags, flag.value]);
                }
              }}
            >
              {flag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="videos-list">
        {Object.entries(files!).map(([key, value], index) => (
          <div
            key={key}
            className="video-list-item my-3"
            onClick={() => setKey(key)}
          >
            <Thumbnail
              src={thumbnails[index]}
              filename={value[0]}
              loading={loading}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
