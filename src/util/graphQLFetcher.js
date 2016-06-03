import fetch from 'isomorphic-fetch'

const APP_BASEURL = process.env.APP_BASEURL || null

export default function graphQLFetcher(lgJWT, baseURL, origin = APP_BASEURL) {
  if (!lgJWT) {
    throw new Error('Need lgJWT to set "Authorization:" header')
  }
  if (!baseURL) {
    throw new Error('Need base URL of GraphQL API service')
  }
  if (!origin) {
    throw new Error('Need origin to set the "Origin:" HTTP header')
  }
  return graphQLParams => {
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lgJWT}`,
        'Origin': origin,
        'Content-Type': 'application/json',
        'LearnersGuild-Skip-Update-User-Middleware': 1,
      },
      body: JSON.stringify(graphQLParams),
    }

    return fetch(`${baseURL}/graphql`, options)
      .then(resp => {
        if (!resp.ok) {
          throw new Error(`GraphQL ERROR: ${resp.statusText}`)
        }
        return resp.json()
      })
      .then(graphQLResponse => {
        if (graphQLResponse.errors) {
          const messages = graphQLResponse.errors.map(e => e.message)
          throw new Error(messages.join('\n'))
        }
        return graphQLResponse.data
      })
  }
}
