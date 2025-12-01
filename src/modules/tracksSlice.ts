/**
 * Keeps track of playing learning tracks.
 */
import Tag, { Track, TrackPart } from '@app/lib/models/Tag'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type TagTracks = {
  [key in TrackPart]?: Track
}

export interface TracksState {
  selectedPart: TrackPart
  tagTracks: TagTracks
}

export const initialState: TracksState = {
  selectedPart: TrackPart.AllParts,
  tagTracks: {},
}

/**
 * Gets the to play based on the selected part,
 * falling back to All Parts if available, or the first track in the list.
 */
export function getSelectedTrack(
  tagTracks: TagTracks,
  selectedPart: TrackPart,
): Track | undefined {
  if (tagTracks && Object.entries(tagTracks).length > 0) {
    if (selectedPart && tagTracks[selectedPart]) {
      return tagTracks[selectedPart]
    }
    return tagTracks[TrackPart.AllParts] || Object.entries(tagTracks)[0][1]
  }
  return undefined
}

export const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    setTagTracks: (state, action: PayloadAction<Tag>) => {
      const tracks = action.payload.tracks || []
      const map = new Map(tracks.map(track => [track.part, track]))
      state.tagTracks = Object.fromEntries(map)
    },
    setSelectedPart: (state, action: PayloadAction<TrackPart>) => {
      state.selectedPart = action.payload
    },
  },
})

// export const playTrack = createAsyncThunk<
//   void,
//   void,
//   {
//     dispatch: AppDispatch
//     state: RootState
//     rejectValue: string
//   }
// >('tracks/playTrack', async (_, thunkAPI) => {
//   const state = thunkAPI.getState()
//   const track = state.tracks.selectedTrack
//   console.log(`playTrack called with track ${track?.url}`)
//   try {
//     const player = useAudioPlayer(track?.url)
//     console.log(`calling play on ${player}`)
//     player.play()
//     const status = useAudioPlayerStatus(player)
//     thunkAPI.dispatch(tracksSlice.actions.setPlayer(player))
//     thunkAPI.dispatch(tracksSlice.actions.setPlayerStatus(status))
//   } catch (error) {
//     console.error('Error in playTrack:', error)
//   }
// })

// export const playOrPause = createAsyncThunk<
//   void,
//   void,
//   {
//     dispatch: AppDispatch
//     state: RootState
//     rejectValue: string
//   }
// >('tracks/playOrPause', async (_, thunkAPI) => {
//   const state = thunkAPI.getState()
//   const track = state.tracks.selectedTrack
//   if (track) {
//     const player = state.tracks.player
//     if (!player) {
//       console.warn('No track player available in playOrPause')
//       return
//     }
//     if (state.tracks.audioStatus?.playing) {
//       player.pause()
//     } else {
//       thunkAPI.dispatch(playTrack())
//     }
//   }
// })

// export const stopTrack = createAsyncThunk<
//   void,
//   void,
//   {
//     dispatch: AppDispatch
//     state: RootState
//     rejectValue: string
//   }
// >('tracks/stopTrack', async (_, thunkAPI) => {
//   const state = thunkAPI.getState()
//   if (state.tracks.player) {
//     state.tracks.player.pause()
//   }
// })

export const { setTagTracks, setSelectedPart } = tracksSlice.actions

export default tracksSlice.reducer
