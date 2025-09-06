import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryHandler } from './base-query'

export const jsonplaceholderApi = createApi({
  reducerPath: 'jsonplaceholder-api',
  tagTypes: ['jsonplaceholder'],
  baseQuery: (args, api, extraOptions) => {
    return baseQueryHandler(args, api, extraOptions)
  },
  endpoints: (builder) => ({
    getPostsAsync: builder.query<any, any>({
      query: (params: any) => ({
        url: '/posts',
        method: 'GET',
        params: {
          ...params,
        },
      }),
    }),
    createPostAsync: builder.mutation({
      query: (body: any) => ({
        url: '/posts',
        method: 'POST',
        body,
      }),
    }),
    updatePostAsync: builder.mutation({
      query: (body: any) => ({
        url: `/posts/${body.id}`,
        method: 'PUT',
        body,
      }),
    }),
    deletePostAsync: builder.mutation({
      query: (id: string) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
})

export const {
  useGetPostsAsyncQuery,
  useCreatePostAsyncMutation,
  useUpdatePostAsyncMutation,
  useDeletePostAsyncMutation,
} = jsonplaceholderApi
