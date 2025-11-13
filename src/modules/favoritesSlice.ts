import { SortOrder } from '@app/constants/Search'
import { buildFavorite, FavoritesById } from '@app/lib/models/Favorite'
import Tag, {
  ConvertedTags,
  IdsByString,
  StringsByNumber,
  TagsById,
} from '@app/lib/models/Tag'
import { RootState } from '@app/store'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import ReactNativeBlobUtil from 'react-native-blob-util'
import Share from 'react-native-share'
import { fetchAndConvertTags } from './searchutil'
import {
  LoadingState,
  sortAlpha,
  sortTagsAlpha,
  TagListState,
  TagListType,
} from './tagLists'
import { SelectedTag } from './tagListUtil'
import { ThunkApiConfig } from './thunkApiConfig'

type LabelsState = {
  labelsByTagId: StringsByNumber
  tagIdsByLabel: IdsByString
  // needed since labeled tags are no longer automatically favorites
  labeledById: TagsById
  labels: Array<string>
  selectedLabel?: string
  labeledSortOrder: SortOrder
  labeledSelectedTag?: SelectedTag
  labelError?: string
  // selected tag that has had selected label removed
  strandedTag?: { tag: Tag; label: string }
}
export type FavoritesState = {
  tagsById: FavoritesById
  allTagIds: Array<number>
  error?: string
  loadingState: LoadingState
  selectedTag?: SelectedTag
  sortOrder: SortOrder
} & LabelsState

export const LabelsInitialState: LabelsState = {
  labelsByTagId: {},
  tagIdsByLabel: {},
  labeledById: {},
  labels: [],
  labeledSortOrder: SortOrder.alpha,
}

export const InitialState: FavoritesState = {
  ...LabelsInitialState,
  allTagIds: [], // array of favorite tag ids
  loadingState: LoadingState.idle,
  tagsById: {}, // map of favorite tag id -> tag
  sortOrder: SortOrder.alpha,
}

/**
 * Sorts favorites list by newest added date
 */
function sortNewest(state: FavoritesState) {
  const addedTime = (id: number) =>
    state.tagsById[id].addedDate ? state.tagsById[id].addedDate : '0'
  state.allTagIds.sort(
    (id1, id2) => -addedTime(id1).localeCompare(addedTime(id2)),
  )
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: InitialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<Tag>) => {
      const tag = action.payload
      const id = tag.id
      state.tagsById[id] = buildFavorite(tag)
      if (!state.allTagIds.includes(id)) {
        if (state.sortOrder === SortOrder.newest) {
          // just put fav at the head of the list, since it's newest
          state.allTagIds.unshift(id)
        } else {
          state.allTagIds.push(id)
          sortAlpha(state)
        }
      }
    },
    addFavorites: (state, action: PayloadAction<Tag[]>) => {
      const tags = action.payload
      tags.forEach(tag => {
        const id = tag.id
        state.tagsById[id] = buildFavorite(tag)
        if (!state.allTagIds.includes(id)) {
          if (state.sortOrder === SortOrder.newest) {
            // just put fav at the head of the list, since it's newest
            state.allTagIds.unshift(id)
          } else {
            state.allTagIds.push(id)
          }
        }
        if (state.sortOrder === SortOrder.alpha) {
          sortAlpha(state)
        }
      })
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      const tagId: number = action.payload
      delete state.tagsById[tagId]
      _.pull(state.allTagIds, tagId)
      // what tag to display when last tag in list is unfavorited?
      if (
        state.selectedTag &&
        state.selectedTag.index > state.allTagIds.length - 1
      ) {
        if (state.selectedTag.index > 0) {
          state.selectedTag.index -= 1
        } else {
          state.selectedTag = undefined
        }
      }
    },
    replaceFavorite: (state, action: PayloadAction<Tag>) => {
      const tag = action.payload
      const id = tag.id
      const oldFavorite = state.tagsById[id]
      if (oldFavorite) {
        state.tagsById[id] = buildFavorite(tag, oldFavorite.addedDate)
      }
    },
    resetFavorites: state => {
      Object.assign(state, InitialState)
    },
    setSelectedFavoriteTag: (state, action: PayloadAction<SelectedTag>) => {
      state.selectedTag = action.payload
    },
    setSelectedLabeledTag: (state, action: PayloadAction<SelectedTag>) => {
      state.labeledSelectedTag = action.payload
    },
    toggleSortOrder: state => {
      state.selectedTag = undefined
      if (state.sortOrder === SortOrder.newest) {
        // switch to alphabetical
        sortAlpha(state)
        state.sortOrder = SortOrder.alpha
      } else {
        // switch to newest
        sortNewest(state)
        state.sortOrder = SortOrder.newest
      }
    },
    toggleLabeledSortOrder: state => {
      state.selectedTag = undefined
      state.labeledSortOrder =
        state.labeledSortOrder === SortOrder.newest
          ? SortOrder.alpha
          : SortOrder.newest
    },
    createLabel: (state, action: PayloadAction<string>) => {
      const label = action.payload.trim()
      if (state.labels.includes(label)) {
        state.labelError = `label already exists`
      } else {
        state.labels.unshift(label)
        if (!state.tagIdsByLabel[label]) {
          state.tagIdsByLabel[label] = []
        }
      }
    },
    // add a label to a tag (creating it if necessary)
    addLabel: (state, action: PayloadAction<{ tag: Tag; label: string }>) => {
      const tag = action.payload.tag
      const tagId = tag.id
      const label = action.payload.label.trim()
      const tagIds = state.tagIdsByLabel[label] || []
      state.tagIdsByLabel[label] = [...new Set([...tagIds, tagId])]
      const labels = state.labelsByTagId[tagId] || []
      state.labelsByTagId[tagId] = [...new Set([...labels, label])]
      state.labeledById[tagId] = tag
      state.labels = [...new Set([...state.labels, label])]
    },
    removeLabel: (
      state,
      action: PayloadAction<{
        id: number
        label: string
        tagListType: TagListType
      }>,
    ) => {
      const { id, label, tagListType } = action.payload
      if (
        tagListType === label &&
        state.selectedLabel === label &&
        state.labeledById[id]
      ) {
        // removing currently select label from tag while in label list
        // need to handle this case carefully, since tag will be "stranded"
        state.strandedTag = { tag: state.labeledById[id], label }
      }
      _.pull(state.tagIdsByLabel[label], id)
      const labels = _.pull(state.labelsByTagId[id], label)
      if (!labels || labels.length === 0) {
        delete state.labelsByTagId[id]
        delete state.labeledById[id]
      }
    },
    removeStrandedTag: state => {
      // to be called when navigating back to tag list from "stranded" tag
      // that has had its label for the currently selected label removed
      delete state.strandedTag
    },
    renameLabel: (
      state,
      action: PayloadAction<{ oldLabel: string; newLabel: string }>,
    ) => {
      const { oldLabel, newLabel } = action.payload
      const tagIds = state.tagIdsByLabel[oldLabel]
      if (tagIds) {
        state.tagIdsByLabel[newLabel] = state.tagIdsByLabel[oldLabel]
        delete state.tagIdsByLabel[oldLabel]
        state.labelsByTagId = _.mapValues(state.labelsByTagId, labels =>
          _.map(labels, label => (label === oldLabel ? newLabel : label)),
        )
        state.labels = state.labels.map(x => (x === oldLabel ? newLabel : x))
        if (state.selectedLabel === oldLabel) {
          state.selectedLabel = newLabel
        }
      }
    },
    deleteLabel: (state, action: PayloadAction<string>) => {
      const label = action.payload
      delete state.tagIdsByLabel[label]
      Object.keys(state.labelsByTagId).forEach(key => {
        const tagId = Number(key)
        const labels = _.pull(state.labelsByTagId[tagId], label)
        if (!labels || labels.length === 0) {
          delete state.labelsByTagId[tagId]
          delete state.labeledById[tagId]
        }
      })
      _.pull(state.labels, label)
      if (state.selectedLabel === label) {
        delete state.selectedLabel
      }
    },
    clearLabels: state => {
      Object.assign(state, LabelsInitialState)
    },
    selectLabel: (state, action: PayloadAction<string>) => {
      state.selectedLabel = action.payload
    },
    unselectLabel: state => {
      state.selectedLabel = undefined
    },
    clearLabelError: state => {
      delete state.labelError
    },
    setLabels: (state, action: PayloadAction<string[]>) => {
      state.labels = action.payload
    },
  },
  extraReducers: builder => {
    builder.addCase(refreshFavorite.pending, state => {
      state.loadingState = LoadingState.pending
    })
    builder.addCase(
      refreshFavorite.fulfilled,
      (state, action: PayloadAction<Tag | undefined>) => {
        if (action.payload) {
          favoritesSlice.caseReducers.addFavorite(
            state,
            action as PayloadAction<Tag>,
          )
        }
        state.loadingState = LoadingState.succeeded
      },
    )
    builder.addCase(refreshFavorite.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
    builder.addCase(receiveSharedFile.pending, state => {
      state.loadingState = LoadingState.pending
    })
    builder.addCase(
      receiveSharedFile.fulfilled,
      (state, action: PayloadAction<ReceivedData | undefined>) => {
        // receive shared favorites and labels
        if (action.payload) {
          if (action.payload.favorites?.length > 0) {
            favoritesSlice.caseReducers.addFavorites(state, {
              payload: action.payload.favorites,
              type: 'addFavorites',
            })
          }
          if (action.payload.receivedLabels?.length > 0) {
            action.payload.receivedLabels.forEach(receivedLabel => {
              receivedLabel.tags.forEach(tag => {
                favoritesSlice.caseReducers.addLabel(state, {
                  payload: { tag: tag, label: receivedLabel.label },
                  type: 'addLabel',
                })
              })
            })
          }
        }
        state.loadingState = LoadingState.succeeded
      },
    )
    builder.addCase(receiveSharedFile.rejected, (state, action) => {
      state.loadingState = LoadingState.failed
      state.error = action.payload
    })
  },
})

/**
 * Refreshes a favorite.
 */
export const refreshFavorite = createAsyncThunk<
  Tag | undefined,
  number,
  ThunkApiConfig
>('favorites/refresh', async (id, thunkAPI) => {
  try {
    let convertedTags: ConvertedTags
    try {
      convertedTags = await fetchAndConvertTags({ id }, false /* useApi */)
    } catch (e) {
      console.log(e)
      const baseUrl = `https://goodtags.net/goodtags/xml/${id}.xml` // TODO
      convertedTags = await fetchAndConvertTags({}, false /* useApi */, baseUrl)
    }
    const { tags } = convertedTags
    return tags?.[0] || thunkAPI.rejectWithValue(`Tag ${id} not found`)
  } catch (e) {
    return thunkAPI.rejectWithValue(`Unable to download tag with id ${id}`)
  }
})

export const selectFavorites = (state: RootState): TagListState => {
  const favs = state.favorites
  return {
    allTagIds: favs.allTagIds,
    error: favs.error,
    loadingState: favs.loadingState,
    selectedTag: favs.selectedTag,
    tagsById: favs.tagsById,
    sortOrder: favs.sortOrder,
  }
}

export const selectLabelState = (
  favs: FavoritesState,
  label: string,
): TagListState => {
  const ids = favs.tagIdsByLabel[label]
  const allTagIds = ids ? [...ids] : []
  if (
    favs.strandedTag?.tag.id === favs.labeledSelectedTag?.id &&
    favs.strandedTag?.label === label
  ) {
    // special case: selected label has been removed from selected tag,
    // return just the formerly labeled tag to avoid weirdness
    const tag = favs.strandedTag.tag
    return {
      allTagIds: [tag.id],
      error: undefined,
      loadingState: LoadingState.idle,
      selectedTag: { id: tag.id, index: 0 },
      tagsById: { [tag.id]: tag },
      sortOrder: favs.labeledSortOrder,
    }
  }
  if (allTagIds.length > 0) {
    if (favs.labeledSortOrder === SortOrder.alpha) {
      sortTagsAlpha(favs.labeledById, allTagIds)
    } else {
      allTagIds.sort((id1, id2) => id2 - id1)
    }
  }
  return {
    allTagIds,
    error: undefined,
    loadingState: LoadingState.idle,
    selectedTag: favs.labeledSelectedTag,
    tagsById: favs.labeledById,
    sortOrder: favs.labeledSortOrder,
  }
}

export const selectLabel = (state: RootState, label: string): TagListState => {
  const favs = state.favorites
  if (label) {
    return selectLabelState(favs, label)
  } else {
    return {
      allTagIds: [],
      error: 'no label selected',
      loadingState: LoadingState.idle,
      selectedTag: undefined,
      tagsById: {},
      sortOrder: SortOrder.alpha,
    }
  }
}

export const shareFavorites = async (favorites: FavoritesState) => {
  try {
    const path: string = await writeFavoritesToFile(favorites)
    console.info(`wrote favorites to ${path}`)
    const response = await Share.open({
      url: `file://${path}`,
      type: 'application/json',
    })
    console.info(response)
  } catch (e) {
    console.info(`error sharing favorites: ${e}`)
  }
}

export interface SharedFavorite {
  id: number
  title: string
}

export interface SharedLabel {
  label: string
  tags: SharedFavorite[]
}

export interface SharedData {
  favorites: SharedFavorite[]
  labels: SharedLabel[]
  date: string
}

const buildLabeledTags = (
  label: string,
  tagIds: number[],
  tagsById: TagsById,
) => {
  const tags = tagIds.map(id => {
    const tag = tagsById[id]
    return { id, title: tag.title }
  })
  return { label, tags }
}

/**
 * Builds a data structure for sharing favorites
 *
 * @param favoritesById Map of tag id to favorite
 */
const buildSharedData = (favorites: FavoritesState): SharedData => {
  const sharedFavorites = Object.entries(favorites.tagsById).map(
    ([id, tag]) => ({
      id: Number(id),
      title: tag.title,
    }),
  )

  const labels = Object.entries(favorites.tagIdsByLabel).map(([label, ids]) =>
    buildLabeledTags(label, ids, favorites.labeledById),
  )
  return {
    favorites: sharedFavorites,
    labels,
    date: new Date().toISOString(),
  }
}

const writeFavoritesToString = (favorites: FavoritesState): string => {
  const filedata = buildSharedData(favorites)
  return JSON.stringify(filedata, null, 2)
}

const writeFavoritesToFile = async (
  favorites: FavoritesState,
): Promise<string> => {
  const fs = ReactNativeBlobUtil.fs
  const dir = fs.dirs.CacheDir + '/goodtags'
  const dirExists = await fs.isDir(dir)
  if (dirExists) {
    console.info(`directory ${dir} already exists`)
  } else {
    await fs.mkdir(dir)
    console.info(`created directory ${dir}`)
  }
  const filename = `faves-labels-${getDateString(new Date())}.json`
  const path = `${dir}/${filename}`
  console.info(`path: ${path}`)
  const favString = writeFavoritesToString(favorites)
  await fs.writeFile(path, favString, 'utf8')
  return path
}

export const getDateString = (date: Date) => {
  const zeroPad = (num: number): string => num.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = zeroPad(date.getMonth() + 1)
  const day = zeroPad(date.getDate())
  const hours = zeroPad(date.getHours())
  const minutes = zeroPad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}-${minutes}`
}

export const FavoritesActions = favoritesSlice.actions

export default favoritesSlice.reducer

interface ReceivedLabel {
  label: string
  tags: Tag[]
}

interface ReceivedData {
  favorites: Tag[]
  receivedLabels: ReceivedLabel[]
}


function getFilename(url: string): string {
  const filePart = url.split('/').pop()
  return filePart ? decodeURI(filePart) : ''
}

function getImportErrorMessage(url: string): string {
  const filename = getFilename(url)
  const message = 'unable to import favorites'
  return filename ? `${message} from ${filename}` : message
}

/**
 * Import favorites/labels from file (or stream: tbd).
 *
 * @see builder.addCase(receiveSharedFile.fulfilled, ...) above
 * for code that actually processes imported data
 */
export const receiveSharedFile = createAsyncThunk<
  ReceivedData,
  string,
  ThunkApiConfig
>('favorites/import', async (url, thunkAPI) => {
  async function receiveData(data: string) {
    try {
      const sharedObj = JSON.parse(data)
      const sharedData = sharedObj as SharedData
      if (sharedData.favorites === undefined && sharedData.labels === undefined)
        throw new Error('no favorites or labels found')
      const favoriteIds = sharedData.favorites.map(f => f.id) || []
      const { tags: favorites } = await fetchAndConvertTags(
        { ids: favoriteIds },
        false,
      )
      const receivedLabels = await Promise.all(
        sharedData.labels.map(async sharedLabel => {
          const tagIds = sharedLabel.tags.map(t => t.id)
          const { tags } = await fetchAndConvertTags({ ids: tagIds }, false)
          return { label: sharedLabel.label, tags }
        }),
      )
      return {
        favorites,
        receivedLabels,
      }
    } catch (e) {
      return thunkAPI.rejectWithValue(getImportErrorMessage(url))
    }
  }

  console.info(`importing favorites from ${url}`)
  try {
    const fs = ReactNativeBlobUtil.fs
    // TODO: support reading stream
    // if (url.startsWith("content://")) {
    //   const stream = await fs.readStream(url, "utf8")
    //   let data = ""
    //   stream.onData(chunk => (data += chunk))
    //   stream.onEnd(() => {
    //     try {
    //       return await receiveData(data)
    //     } catch (e) {
    //       console.error(e) // TODO: show error in app
    //     }
    //   })
    //   stream.onError(e => {
    //     throw e
    //   })
    //   stream.open()
    // } else
    if (url.startsWith('/') || url.startsWith('file://')) {
      const path = url.startsWith('file://') ? url.slice(7) : url
      if (!(await fs.exists(path))) {
        throw new Error(`unable to find file ${path}`)
      }
      const data = await fs.readFile(path, 'utf8')
      return await receiveData(data)
    } else {
      throw new Error(`unknown url type: ${url}`)
    }
  } catch (e) {
    console.error(e)
    return thunkAPI.rejectWithValue(getImportErrorMessage(url))
  }
})
