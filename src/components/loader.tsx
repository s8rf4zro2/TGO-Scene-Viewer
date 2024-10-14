export default function Loader({
  currentFile,
  progress,
}: {
  currentFile: string | undefined;
  progress: number;
}) {
  return (
    <div className="flex flex-col gap-5 justify-center items-center h-screen w-screen">
      <div
        className="radial-progress bg-primary text-primary-content border-primary border-4"
        style={{ "--value": progress }}
        role="progressbar"
      >
        {progress}%
      </div>

      <p className="text-center mt-4">
        {currentFile ? `Processing ${currentFile}` : "Loading..."}
      </p>
    </div>
  );
}
