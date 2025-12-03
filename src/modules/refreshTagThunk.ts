import Tag from '@app/lib/models/Tag'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { fetchAndConvertTags } from './searchutil'
import { TagListType } from './tagLists'
import { ThunkApiConfig } from './thunkApiConfig'

/**
 * Refreshes a tag's metadata from the database.
 * This is useful when cached data might be stale (e.g., sheet music URI has changed).
 */
export const refreshTag = createAsyncThunk<
  { tag: Tag; tagListType: TagListType } | undefined,
  { id: number; tagListType: TagListType },
  ThunkApiConfig
>('tagList/refreshTag', async ({ id, tagListType }, thunkAPI) => {
  try {
    const convertedTags = await fetchAndConvertTags({ id }, false /* useApi */)
    const { tags } = convertedTags
    const tag = tags?.[0]

    if (!tag) {
      return thunkAPI.rejectWithValue(`Tag ${id} not found`)
    }

    return { tag, tagListType }
  } catch (e) {
    return thunkAPI.rejectWithValue(`Unable to refresh tag with id ${id}: ${e}`)
  }
})
