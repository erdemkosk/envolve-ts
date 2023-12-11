// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class MongoDBURIComparerLogic {
  static compareURIs (uri1: string, uri2: string): boolean {
    const userPassRegEx = /\/\/(.*):(.*)@/
    const match1 = uri1.match(userPassRegEx)
    const match2 = uri2.match(userPassRegEx)

    if ((match1 != null) && (match2 != null) && match1[1] !== match2[1]) return false
    if ((match1 != null) && (match2 != null) && match1[2] !== match2[2]) return false

    const uri1WithoutUserInfo = uri1.replace(userPassRegEx, '//')
    const uri2WithoutUserInfo = uri2.replace(userPassRegEx, '//')

    return uri1WithoutUserInfo === uri2WithoutUserInfo
  }
}
