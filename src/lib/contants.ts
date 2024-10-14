export const regexBC1 = new RegExp(/^B[Cc]-((?!\dO2).)*\.mp4$/gm);
export const regexBC2 = new RegExp(/^B[Cc]-.+\dO2\.mp4$/gm);
export const regexPS = new RegExp(/^PS\-.*\.mp4$/);
export const regexProfiles = new RegExp(/^Fig-.+\.mp4$/);
export const regexSfw = new RegExp(
  /^(AnDnr.+|BoMcBox.+|BrRead.+|Character|ChFb|ChJuAt.+|Dinner|DiDuFght.+|DiHrFight.+|DmlsFght.+|DuMcGnThrow.+|ElChDicks|ElDicks|ErInt.+|ElHnArmW.+|ElHnChTma.+|ErMcDiner|ElTaDiFgt.+|ErJuMcChHnElDinner|HeCaGrd.+|HeHomesale.+|HeMcBYKs|HeWorkout.*|HnErMcJuChDinner|HnMag|JoChMc|JuSearch.+|JuSpdr.+|LaWrkOut.+|KiAdMcint|KiMeMcInt|KiMcInterview|KiScandal|KmChr.+|Li-Meet.+|MadalynPast|McErHrRead|MdJuFrst.+|MeAdMcYg.+|MinJS|MlScrRm.+|NeBoJoObMc.+|NoMcInt|PLACEHOLDER|ZephWrite)\.mp4$/
);
export const regexOther = new RegExp(
  /^(AmuletH|Character|Ending.+|.+Logo|Opening|Oracle|Research.+|Title|Toma-.+)\.mp4$/
);

export const videoRegex = /^((?!-l).)+\.mp4$/;

export enum Flags {
  nsfw = "nsfw",
  sfw = "sfw",
  bc1 = "bc1",
  bc2 = "bc2",
  ps = "ps",
  profiles = "profiles",
  other = "other",
}
