/**
 * Source: https://github.com/TheNetsky/community-ext
 */
interface Language {
  name: string;
  BTCode: string;
  lang: string;
  default?: boolean;
}

class BTLanguagesClass {
  Languages: Language[] = [
    {
      name: "English",
      BTCode: "en",
      lang: "🇬🇧",
      default: true,
    },
    {
      name: "Arabic",
      BTCode: "ar",
      lang: "🇸🇦",
    },
    {
      name: "Bulgarian",
      BTCode: "bg",
      lang: "🇧🇬",
    },
    {
      name: "Chinese",
      BTCode: "zh",
      lang: "🇨🇳",
    },
    {
      name: "Czech",
      BTCode: "cs",
      lang: "🇨🇿",
    },
    {
      name: "Danish",
      BTCode: "da",
      lang: "🇩🇰",
    },
    {
      name: "Dutch",
      BTCode: "nl",
      lang: "🇳🇱",
    },
    {
      name: "Filipino",
      BTCode: "fil",
      lang: "🇵🇭",
    },
    {
      name: "Finnish",
      BTCode: "fi",
      lang: "🇫🇮",
    },
    {
      name: "French",
      BTCode: "fr",
      lang: "🇫🇷",
    },
    {
      name: "German",
      BTCode: "de",
      lang: "🇩🇪",
    },
    {
      name: "Greek",
      BTCode: "el",
      lang: "🇬🇷",
    },
    {
      name: "Hebrew",
      BTCode: "he",
      lang: "🇮🇱",
    },
    {
      name: "Hindi",
      BTCode: "hi",
      lang: "🇮🇳",
    },
    {
      name: "Hungarian",
      BTCode: "hu",
      lang: "🇭🇺",
    },
    {
      name: "Indonesian",
      BTCode: "id",
      lang: "🇮🇩",
    },
    {
      name: "Italian",
      BTCode: "it",
      lang: "🇮🇹",
    },
    {
      name: "Japanese",
      BTCode: "ja",
      lang: "🇯🇵",
    },
    {
      name: "Korean",
      BTCode: "ko",
      lang: "🇰🇷",
    },
    {
      name: "Malay",
      BTCode: "ms",
      lang: "🇲🇾",
    },
    {
      name: "Polish",
      BTCode: "pl",
      lang: "🇵🇱",
    },
    {
      name: "Portuguese",
      BTCode: "pt",
      lang: "🇵🇹",
    },
    {
      name: "Portuguese (Brazil)",
      BTCode: "pt_br",
      lang: "🇧🇷",
    },
    {
      name: "Romanian",
      BTCode: "ro",
      lang: "🇷🇴",
    },
    {
      name: "Russian",
      BTCode: "ru",
      lang: "🇷🇺",
    },
    {
      name: "Spanish",
      BTCode: "es",
      lang: "🇪🇸",
    },
    {
      name: "Spanish (Latin America)",
      BTCode: "es_419",
      lang: "🌎",
    },
    {
      name: "Swedish",
      BTCode: "sv",
      lang: "🇸🇪",
    },
    {
      name: "Thai",
      BTCode: "th",
      lang: "🇹🇭",
    },
    {
      name: "Turkish",
      BTCode: "tr",
      lang: "🇹🇷",
    },
    {
      name: "Ukrainian",
      BTCode: "uk",
      lang: "🇺🇦",
    },
    {
      name: "Vietnamese",
      BTCode: "vi",
      lang: "🇻🇳",
    },
    {
      name: "Afrikaans",
      BTCode: "af",
      lang: "🇿🇦",
    },
    {
      name: "Albanian",
      BTCode: "sq",
      lang: "🇦🇱",
    },
    {
      name: "Amharic",
      BTCode: "am",
      lang: "🇪🇹",
    },
    {
      name: "Armenian",
      BTCode: "hy",
      lang: "🇦🇲",
    },
    {
      name: "Azerbaijani",
      BTCode: "az",
      lang: "🇦🇿",
    },
    {
      name: "Belarusian",
      BTCode: "be",
      lang: "🇧🇾",
    },
    {
      name: "Bengali",
      BTCode: "bn",
      lang: "🇧🇩",
    },
    {
      name: "Bosnian",
      BTCode: "bs",
      lang: "🇧🇦",
    },
    {
      name: "Burmese",
      BTCode: "my",
      lang: "🇲🇲",
    },
    {
      name: "Cambodian",
      BTCode: "km",
      lang: "🇰🇭",
    },
    {
      name: "Catalan",
      BTCode: "ca",
      lang: "🇪🇸",
    },
    {
      name: "Cebuano",
      BTCode: "ceb",
      lang: "🇵🇭",
    },
    {
      name: "Chinese (Cantonese)",
      BTCode: "zh_hk",
      lang: "🇭🇰",
    },
    {
      name: "Chinese (Traditional)",
      BTCode: "zh_tw",
      lang: "🇹🇼",
    },
    {
      name: "Croatian",
      BTCode: "hr",
      lang: "🇭🇷",
    },
    {
      name: "English (United States)",
      BTCode: "en_us",
      lang: "🇺🇸",
    },
    {
      name: "Esperanto",
      BTCode: "eo",
      lang: "🌍",
    },
    {
      name: "Estonian",
      BTCode: "et",
      lang: "🇪🇪",
    },
    {
      name: "Faroese",
      BTCode: "fo",
      lang: "🇫🇴",
    },
    {
      name: "Georgian",
      BTCode: "ka",
      lang: "🇬🇪",
    },
    {
      name: "Guarani",
      BTCode: "gn",
      lang: "🇵🇾",
    },
    {
      name: "Gujarati",
      BTCode: "gu",
      lang: "🇮🇳",
    },
    {
      name: "Haitian Creole",
      BTCode: "ht",
      lang: "🇭🇹",
    },
    {
      name: "Hausa",
      BTCode: "ha",
      lang: "🇳🇬",
    },
    {
      name: "Icelandic",
      BTCode: "is",
      lang: "🇮🇸",
    },
    {
      name: "Igbo",
      BTCode: "ig",
      lang: "🇳🇬",
    },
    {
      name: "Irish",
      BTCode: "ga",
      lang: "🇮🇪",
    },
    {
      name: "Javanese",
      BTCode: "jv",
      lang: "🇮🇩",
    },
    {
      name: "Kannada",
      BTCode: "kn",
      lang: "🇮🇳",
    },
    {
      name: "Kazakh",
      BTCode: "kk",
      lang: "🇰🇿",
    },
    {
      name: "Kurdish",
      BTCode: "ku",
      lang: "🇮🇶",
    },
    {
      name: "Kyrgyz",
      BTCode: "ky",
      lang: "🇰🇬",
    },
    {
      name: "Laothian",
      BTCode: "lo",
      lang: "🇱🇦",
    },
    {
      name: "Latvian",
      BTCode: "lv",
      lang: "🇱🇻",
    },
    {
      name: "Lithuanian",
      BTCode: "lt",
      lang: "🇱🇹",
    },
    {
      name: "Luxembourgish",
      BTCode: "lb",
      lang: "🇱🇺",
    },
    {
      name: "Macedonian",
      BTCode: "mk",
      lang: "🇲🇰",
    },
    {
      name: "Malagasy",
      BTCode: "mg",
      lang: "🇲🇬",
    },
    {
      name: "Malayalam",
      BTCode: "ml",
      lang: "🇮🇳",
    },
    {
      name: "Maltese",
      BTCode: "mt",
      lang: "🇲🇹",
    },
    {
      name: "Maori",
      BTCode: "mi",
      lang: "🇳🇿",
    },
    {
      name: "Marathi",
      BTCode: "mr",
      lang: "🇮🇳",
    },
    {
      name: "Moldavian",
      BTCode: "mo",
      lang: "🇲🇩",
    },
    {
      name: "Mongolian",
      BTCode: "mn",
      lang: "🇲🇳",
    },
    {
      name: "Nepali",
      BTCode: "ne",
      lang: "🇳🇵",
    },
    {
      name: "Norwegian",
      BTCode: "no",
      lang: "🇳🇴",
    },
    {
      name: "Nyanja",
      BTCode: "ny",
      lang: "🇲🇼",
    },
    {
      name: "Pashto",
      BTCode: "ps",
      lang: "🇦🇫",
    },
    {
      name: "Persian",
      BTCode: "fa",
      lang: "🇮🇷",
    },
    {
      name: "Romansh",
      BTCode: "rm",
      lang: "🇨🇭",
    },
    {
      name: "Samoan",
      BTCode: "sm",
      lang: "🇼🇸",
    },
    {
      name: "Serbian",
      BTCode: "sr",
      lang: "🇷🇸",
    },
    {
      name: "Serbo-Croatian",
      BTCode: "sh",
      lang: "🇧🇦",
    },
    {
      name: "Sesotho",
      BTCode: "st",
      lang: "🇱🇸",
    },
    {
      name: "Shona",
      BTCode: "sn",
      lang: "🇿🇼",
    },
    {
      name: "Sindhi",
      BTCode: "sd",
      lang: "🇵🇰",
    },
    {
      name: "Sinhalese",
      BTCode: "si",
      lang: "🇱🇰",
    },
    {
      name: "Slovak",
      BTCode: "sk",
      lang: "🇸🇰",
    },
    {
      name: "Slovenian",
      BTCode: "sl",
      lang: "🇸🇮",
    },
    {
      name: "Somali",
      BTCode: "so",
      lang: "🇸🇴",
    },
    {
      name: "Swahili",
      BTCode: "sw",
      lang: "🇹🇿",
    },
    {
      name: "Tajik",
      BTCode: "tg",
      lang: "🇹🇯",
    },
    {
      name: "Tamil",
      BTCode: "ta",
      lang: "🇮🇳",
    },
    {
      name: "Tigrinya",
      BTCode: "ti",
      lang: "🇪🇷",
    },
    {
      name: "Tonga",
      BTCode: "to",
      lang: "🇹🇴",
    },
    {
      name: "Turkmen",
      BTCode: "tk",
      lang: "🇹🇲",
    },
    {
      name: "Urdu",
      BTCode: "ur",
      lang: "🇵🇰",
    },
    {
      name: "Uzbek",
      BTCode: "uz",
      lang: "🇺🇿",
    },
    {
      name: "Yoruba",
      BTCode: "yo",
      lang: "🇳🇬",
    },
    {
      name: "Zulu",
      BTCode: "zu",
      lang: "🇿🇦",
    },
    {
      name: "Other",
      BTCode: "_t",
      lang: "🌍",
    },
    {
      name: "Basque",
      BTCode: "eu",
      lang: "🇪🇺",
    },
    {
      name: "Portuguese (Portugal)",
      BTCode: "pt-PT",
      lang: "🇵🇹",
    },
  ]
  constructor() {
    // Sorts the languages based on name
    this.Languages = this.Languages.sort((a, b) => (a.name > b.name ? 1 : -1))
  }

  getBTCodeList(): string[] {
    return this.Languages.map((Language) => Language.BTCode)
  }
  getName(BTCode: string): string {
    return (
      this.Languages.filter((Language) => Language.BTCode == BTCode)[0]?.name ??
      "Unknown"
    )
  }
  getLangCode(BTCode: string): string {
    return (
      this.Languages.filter((Language) => Language.BTCode == BTCode)[0]?.lang ??
      "🇬🇧"
    )
  }
  getDefault(): string[] {
    return this.Languages.filter((Language) => Language.default).map(
      (Language) => Language.BTCode
    )
  }
}

export const BTLanguages = new BTLanguagesClass()
