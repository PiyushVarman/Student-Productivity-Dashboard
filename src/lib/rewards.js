/**
 * Rewards System Configuration & Utilities
 *
 * Reward Distribution:
 * Level 1 (from the beginning):
 *   - Background: Default, Icons
 *   - Music: 40Hz Binaural Beats, Keyboard ASMR
 * Level 2:
 *   - Music: Snowman
 * Level 4:
 *   - Background: your name.
 * Level 5:
 *   - Background: Pastel
 *   - Music: Close My Eyes
 * Level 7:
 *   - Music: the songbird and the bookworm
 * Level 9:
 *   - Background: Film Burn
 * Level 10:
 *   - Background: Study Desk
 *   - Music: Growth Story
 * Level 13:
 *   - Background: Brand New Day
 * Level 15:
 *   - Music: Solitude
 * Level 20:
 *   - Background: Outer Space
 * Level 25:
 *   - Background: macOS Golden Gate (Light), macOS Golden Gate (Dark)
 */

export const WALLPAPERS = [
  { id: "default", src: "", title: "Default", theme: "default", minLevel: 1 },
  { id: "icons", src: "/wallpapers/icons.png", title: "Icons", theme: "dark", minLevel: 1 },
  { id: "yourname", src: "/wallpapers/yourname.jpg", title: "your name.", theme: "dark", minLevel: 4 },
  { id: "pastel", src: "/wallpapers/pastel.png", title: "Pastel", theme: "light", minLevel: 5 },
  { id: "filmburn", src: "/wallpapers/filmburn.png", title: "Film Burn", theme: "dark", minLevel: 9 },
  { id: "studydesk", src: "/wallpapers/study_desk.png", title: "Study Desk", theme: "light", minLevel: 10 },
  { id: "BND", src: "/wallpapers/brandnewday.webp", title: "Brand New Day", theme: "dark", minLevel: 13 },
  { id: "Space", src: "/wallpapers/space.jpg", title: "Outer Space", theme: "dark", minLevel: 20 },
  { id: "goldengatelight", src: "/wallpapers/goldengatelight.png", title: "macOS Golden Gate (Light)", theme: "light", minLevel: 25 },
  { id: "goldengatedark", src: "/wallpapers/goldengatedark.png", title: "macOS Golden Gate (Dark)", theme: "dark", minLevel: 25 },
];

export const TRACKS = [
  {
    id: "track-6",
    name: "40Hz Binaural Beats",
    src: "/music/40HzBinauralBeats.mp3",
    data: { title: "40Hz Binaural Beats", artist: "Be Inspired | Studio" },
    minLevel: 1,
  },
  {
    id: "track-7",
    name: "Keyboard ASMR",
    src: "/music/Keyboardasmr.mp3",
    data: { title: "Keyboard ASMR", artist: "faye" },
    minLevel: 1,
  },
  {
    id: "track-1",
    name: "Snowman",
    src: "/music/Snowman.mp3",
    data: { title: "Snowman", artist: "WYS" },
    minLevel: 2,
  },
  {
    id: "track-2",
    name: "Close My Eyes",
    src: "/music/CloseMyEyes.mp3",
    data: { title: "Close My Eyes", artist: "WYS" },
    minLevel: 5,
  },
  {
    id: "track-4",
    name: "the songbird and the bookworm",
    src: "/music/songbirdandbookworm.mp3",
    data: { title: "the songbird and the bookworm", artist: "Blue Wednesday" },
    minLevel: 7,
  },
  {
    id: "track-5",
    name: "Growth Story",
    src: "/music/GrowthStory.mp3",
    data: { title: "Growth Story", artist: "Kupla" },
    minLevel: 10,
  },
  {
    id: "track-3",
    name: "Solitude",
    src: "/music/Solitude.mp3",
    data: { title: "Solitude", artist: "DonVayei" },
    minLevel: 15,
  },
];

/**
 * Returns rewards unlocked precisely at a given level.
 */
export function getRewardsForLevel(level) {
  const lvl = Number(level);
  const rewards = [];
  WALLPAPERS.forEach((wp) => {
    if (wp.minLevel === lvl) {
      rewards.push({ type: "background", name: wp.title, ...wp });
    }
  });
  TRACKS.forEach((track) => {
    if (track.minLevel === lvl) {
      rewards.push({ type: "music", name: track.name, ...track });
    }
  });
  return rewards;
}

/**
 * Returns all rewards unlocked within a range [startLevel, endLevel].
 */
export function getUnlockedRewardsBetween(startLevel, endLevel) {
  const rewards = [];
  const start = Math.max(1, Number(startLevel));
  const end = Math.max(start, Number(endLevel));
  for (let l = start; l <= end; l++) {
    rewards.push(...getRewardsForLevel(l));
  }
  return rewards;
}

/**
 * Checks what will unlock in the next level (or the nearest upcoming reward level).
 */
export function getNextRewardInfo(currentLevel) {
  const lvl = Math.max(1, Number(currentLevel) || 1);
  const nextLevel = lvl + 1;
  const directRewards = getRewardsForLevel(nextLevel);
  if (directRewards.length > 0) {
    return {
      level: nextLevel,
      isDirectNext: true,
      nextLevel: nextLevel,
      rewards: directRewards,
    };
  }

  // Find nearest upcoming level with rewards
  const allRewardLevels = [1, 2, 4, 5, 7, 9, 10, 13, 15, 20, 25];
  const upcomingLevel = allRewardLevels.find((l) => l > lvl);
  if (upcomingLevel) {
    return {
      level: upcomingLevel,
      isDirectNext: false,
      nextLevel: nextLevel,
      rewards: getRewardsForLevel(upcomingLevel),
    };
  }

  return null;
}
