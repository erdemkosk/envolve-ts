/* eslint-disable @typescript-eslint/strict-boolean-expressions */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class MongoDBURIComparerLogic {
  static compareURIs (uri1: string, uri2: string): boolean {
    const URL_REGEXP = /^(mongodb\+srv:\/\/)([^:]+):([^@]+)@([^/]+)\/(.+)$/

    const match1 = uri1.match(URL_REGEXP)
    const match2 = uri2.match(URL_REGEXP)

    if (!match1 || !match2) {
      return false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [, protocol1, user1, pass1, host1, path1] = match1
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [, protocol2, user2, pass2, host2, path2] = match2

    if (protocol1 !== protocol2 || path1 !== path2) {
      return false
    }

    if (user1 !== user2 && pass1 !== pass2) {
      return false
    }

    return true
  }
}
