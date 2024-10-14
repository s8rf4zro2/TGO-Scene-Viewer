import { invoke } from "@tauri-apps/api/core";
import {
  videoRegex,
  regexBC1,
  regexBC2,
  regexOther,
  regexPS,
  regexProfiles,
  regexSfw,
  Flags,
} from "./contants";

const matchScenes = (movies: string[]) => {
  const scenes: { [key: string]: string[] } = {};

  while (movies.length > 0) {
    const matches = movies[0].match(/^(BC\-3[sS]|[a-zA-Z\-]+)(.*)\.mp4$/)!;

    if (!matches || matches.length < 2) {
      movies.splice(0, 1);
      continue;
    }

    const sceneName = matches[1].replace(/-$/, "");

    const sceneParts = movies.filter(function (movie) {
      return movie.startsWith(sceneName);
    });

    if (typeof scenes[sceneName] === "undefined") {
      scenes[sceneName] = [];
    }

    scenes[sceneName] = scenes[sceneName].concat(sceneParts);
    movies.splice(0, sceneParts.length);
  }

  return splitOutfits(scenes);
};

const splitOutfits = (scenes: { [key: string]: string[] }) => {
  const processedScenes: { [key: string]: string[] } = { ...scenes };

  for (const [name, parts] of Object.entries(scenes)) {
    if (/^B[Cc]-.+$/.test(name)) {
      delete processedScenes[name];
      const newScenes: { [key: string]: string[] } = {};

      for (let i = 0; i < parts.length; i++) {
        let outfit: string;
        if (regexBC2.test(parts[i])) {
          const outfitMatch = parts[i].match(/.+\dO(\d).*/)!;
          outfit = outfitMatch[1];
        } else {
          outfit = "1";
        }

        if (typeof newScenes[outfit] === "undefined") {
          newScenes[outfit] = [];
        }
        newScenes[outfit].push(parts[i]);
      }

      for (const [key, newParts] of Object.entries(newScenes)) {
        if (key === "1") {
          processedScenes[name] = newParts;
        } else {
          processedScenes[name + " (Alt)"] = newParts;
        }
      }
    }
  }

  return processedScenes;
};

export const categorizeVideos = (files: string[]) => {
  const store: Record<string, string[]> = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!videoRegex.test(file)) {
      continue;
    }

    switch (true) {
      case regexBC1.test(file):
        store[Flags.bc1] = store[Flags.bc1]
          ? store[Flags.bc1].concat(file)
          : [file];
        break;
      case regexBC2.test(file):
        store[Flags.bc2] = store[Flags.bc2]
          ? store[Flags.bc2].concat(file)
          : [file];
        break;
      case regexPS.test(file):
        store[Flags.ps] = store[Flags.ps]
          ? store[Flags.ps].concat(file)
          : [file];
        break;
      case regexProfiles.test(file):
        store[Flags.profiles] = store[Flags.profiles]
          ? store[Flags.profiles].concat(file)
          : [file];
        break;
      case regexSfw.test(file):
        store[Flags.sfw] = store[Flags.sfw]
          ? store[Flags.sfw].concat(file)
          : [file];
        break;
      case regexOther.test(file):
        store[Flags.other] = store[Flags.other]
          ? store[Flags.other].concat(file)
          : [file];
        break;
      default:
        store[Flags.nsfw] = store[Flags.nsfw]
          ? store[Flags.nsfw].concat(file)
          : [file];
        break;
    }
  }

  return store;
};

export const getVideos = async (flags: string[]) => {
  const vidArr = await invoke<string[]>("load_videos");

  if (!vidArr?.length) {
    return null;
  }

  const videos = categorizeVideos(vidArr);
  const selectedVideos: string[] = [];

  for (const flag of flags) {
    if (!videos[flag]) {
      continue;
    }

    selectedVideos.push(...videos[flag]);
  }

  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  selectedVideos.sort(collator.compare);

  const scenes = matchScenes(selectedVideos);

  const keys = Object.keys(scenes);

  for (const flag of flags) {
    if (keys.includes(flag)) {
      continue;
    }

    delete scenes[flag];
  }

  return {
    scenes,
    path: await invoke<string>("get_game_dir"),
  };
};
