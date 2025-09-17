export const StoreKeys = {
  include: "include",
  exclude: "exclude",
  language: "language"
}

export class GlobalStore {
  async setLanguage(lang: string[]) {
    return ObjectStore.set(StoreKeys.language, lang)
  }
  async setInclude(inc: string[]) {
    return ObjectStore.set(StoreKeys.include, inc)
  }
  async setExclude(exc: string[]) {
    return ObjectStore.set(StoreKeys.exclude, exc)
  }

  async getLanguage(): Promise<string[]> {
    return await ObjectStore.stringArray(StoreKeys.language)
  }
  async getInclude(): Promise<string[]> {
    return await ObjectStore.stringArray(StoreKeys.include)
  }
  async getExclude(): Promise<string[]> {
    return await ObjectStore.stringArray(StoreKeys.exclude)
  }
}