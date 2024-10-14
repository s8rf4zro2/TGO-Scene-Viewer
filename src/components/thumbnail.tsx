import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useState } from "preact/hooks";

export default function Thumbnail({
  src,
  filename,
  loading,
}: {
  src: string;
  filename: string;
  loading: boolean;
}) {
  const [realSrc, setRealSrc] = useState<string>();

  useEffect(() => {
    if (!src) {
      return;
    }

    async function getRealSrc() {
      setRealSrc(await convertFileSrc(src));
    }

    getRealSrc();
  }, [src]);

  return (
    <div className="group relative z-0">
      {!realSrc && loading ? (
        <div className="skeleton h-[197px] w-[340px] relative group cursor-pointer"></div>
      ) : (
        <img
          className="cursor-pointer rounded-xl z-0"
          width={340}
          height={197}
          src={realSrc}
          alt={filename}
        />
      )}

      <div className="group-hover:opacity-100 opacity-0 flex flex-wrap justify-between bg-black bg-opacity-50 text-white text-sm font-bold rounded-b-xl p-2 absolute bottom-0 w-full transition-opacity duration-200 ease-linear">
        <p>{filename}</p>

        <p>Click to view scene</p>
      </div>
    </div>
  );
}
