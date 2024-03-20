export class GlobalStore {
  async test() {
    console.log("test")
    await ObjectStore.string("test")
  }
  async getTest() {
    console.log(await ObjectStore.get("test"))
  }
}
