import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { RootState } from '~/infrastructure/redux/store'
import { setLogout } from '~/infrastructure/redux/slices/auth.slice'

const baseQuery = (args: any, api: any, extraOptions: any) => {
  return fetchBaseQuery({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    prepareHeaders: (headers, { getState }) => {
      const accessToken = (getState() as RootState).auth.value.accessToken

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }

      return headers
    },
    responseHandler: (response) => {
      return response.json()
    },
  })
}

export const baseQueryHandler = async (args: any, api: any, extraOptions: any) => {
  const baseQueryFn = baseQuery(args, api, extraOptions)
  const response = await baseQueryFn(args, api, extraOptions)

  // Check if we received a 401 Unauthorized response
  if (response.error && response.error.status === 401) {
    // Dispatch logout action to clear auth state
    api.dispatch(setLogout())
  }

  return response
}
