import { type Option, type Tag } from "@suwatte/daisuke"

export const TAGS: Record<string, string> = {
  // Formats
  Oneshot: "99q3m1plnt",
  "Web Comic": "1utcekkc70",
  Doujinshi: "fnvjk3jg1b",
  Adaptation: "pbst9p8bd4",
  "Full Color": "6amsrv3w16",
  "4-Koma": "jnqtucy8q3",
  // Genres
  Action: "g0eao31zjw",
  Adventure: "pjl8oxd1ld",
  "Boys' Love": "1cnfhxwshb",
  Comedy: "onj03z2gnf",
  Crime: "bwec51tbms",
  Drama: "00xq9oqthh",
  Fantasy: "3lhj8r7s6n",
  "Girls' Love": "i9w6sjikyd",
  Historical: "mmf28hr2co",
  Horror: "rclreo8b25",
  "Magical Girls": "hy189x450f",
  Mystery: "hv0hsu8kje",
  Romance: "o0rm4pweru",
  "Slice of Life": "13x7xvq10k",
  Sports: "zsvyg4whkp",
  Tragedy: "85hmqw16y9",
  // Themes
  Cooking: "9wm2j2zl1e",
  Crossdressing: "arjr4qdpgc",
  Delinquents: "h5ioz14hix",
  Genderswap: "25k4gcfnfp",
  Magic: "evt7r78scn",
  "Monster Girls": "ddjrvi8vsu",
  "School Life": "hobsiukk71",
  Shota: "lu0sbwbs3r",
  Supernatural: "c4rnaci8q6",
  "Traditional Games": "aqfqkul8rg",
  Vampires: "djs29flsq6",
  "Video Games": "axstzcu7pc",
  "Office Workers": "6uytt2873o",
  "Martial Arts": "577a4hd52b",
  Zombies: "szg24cwbrm",
  Survival: "mt4vdanhfc",
  Police: "acai4usl79",
  Mafia: "qjuief8bi1",
  // Content
  Gore: "hceia50cf9",
  "Sexual Violence": "xh9k4t31ll",
}

export const TAG_OPTIONS: Tag[] = Object.entries(TAGS).map(([title, id]) => ({
  id,
  title,
}))

export const SORTS = [
  { id: "views", title: "Views" },
  { id: "lastUploadedChapterAt", title: "Latest Chapter" },
  { id: "updatedAt", title: "Updated At" },
  { id: "createdAt", title: "Created At" },
  { id: "title", title: "Title" },
  { id: "rating", title: "Rating" },
  { id: "follows", title: "Follows" },
  { id: "chapters", title: "Chapters" },
  { id: "year", title: "Year" },
]

export const STATUSES: Tag[] = [
  { id: "ongoing", title: "Ongoing" },
  { id: "completed", title: "Completed" },
  { id: "hiatus", title: "Hiatus" },
  { id: "cancelled", title: "Cancelled" },
]

export const DEMOGRAPHICS: Tag[] = [
  { id: "shounen", title: "Shounen" },
  { id: "shoujo", title: "Shoujo" },
  { id: "josei", title: "Josei" },
  { id: "seinen", title: "Seinen" },
]

export const CONTENT_RATINGS: Tag[] = [
  { id: "safe", title: "Safe" },
  { id: "suggestive", title: "Suggestive" },
  { id: "erotica", title: "Erotica" },
  { id: "pornographic", title: "Pornographic" },
]

export const ORIG_LANGUAGES: Tag[] = [
  { id: "en", title: "English" },
  { id: "ja", title: "Japanese" },
  { id: "ko", title: "Korean" },
  { id: "zh", title: "Chinese (Simplified)" },
  { id: "zh-hk", title: "Chinese (Traditional)" },
]

export const LANGUAGE_OPTIONS: Option[] = [
  { id: "en", title: "English" },
  { id: "ja", title: "Japanese" },
  { id: "ko", title: "Korean" },
  { id: "zh", title: "Chinese (Simplified)" },
  { id: "zh-hk", title: "Chinese (Traditional)" },
  { id: "pt-br", title: "Portuguese (Brazil)" },
  { id: "pt", title: "Portuguese" },
  { id: "fr", title: "French" },
  { id: "es", title: "Spanish" },
  { id: "es-la", title: "Spanish (Latin America)" },
  { id: "de", title: "German" },
  { id: "it", title: "Italian" },
  { id: "ru", title: "Russian" },
  { id: "pl", title: "Polish" },
  { id: "tr", title: "Turkish" },
  { id: "ar", title: "Arabic" },
  { id: "id", title: "Indonesian" },
  { id: "vi", title: "Vietnamese" },
  { id: "th", title: "Thai" },
  { id: "uk", title: "Ukrainian" },
  { id: "hu", title: "Hungarian" },
  { id: "nl", title: "Dutch" },
  { id: "sv", title: "Swedish" },
  { id: "ro", title: "Romanian" },
  { id: "cs", title: "Czech" },
  { id: "bg", title: "Bulgarian" },
  { id: "fi", title: "Finnish" },
  { id: "no", title: "Norwegian" },
  { id: "da", title: "Danish" },
  { id: "hr", title: "Croatian" },
  { id: "he", title: "Hebrew" },
  { id: "hi", title: "Hindi" },
  { id: "ms", title: "Malay" },
  { id: "fa", title: "Persian" },
  { id: "mn", title: "Mongolian" },
  { id: "sr", title: "Serbian" },
  { id: "sk", title: "Slovak" },
  { id: "lt", title: "Lithuanian" },
  { id: "bn", title: "Bengali" },
  { id: "tl", title: "Filipino" },
  { id: "my", title: "Burmese" },
]
