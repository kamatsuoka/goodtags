import {buildFavorite, Favorite} from "@app/lib/models/Favorite"
import Tag from "@app/lib/models/Tag"
import reducer, {
  FavoritesActions,
  FavoritesState,
  InitialState,
} from "../favoritesSlice"
import {TagListEnum} from "../tagLists"
const {
  addFavorite,
  removeFavorite,
  createLabel,
  addLabel,
  renameLabel,
  removeLabel,
  deleteLabel,
  selectLabel,
  clearLabels,
} = FavoritesActions

const fav12 = buildFavorite({
  id: 12,
  aka: "Newsies",
  arranger: "",
  key: "Major:C",
  lyrics: "Arise and seize the day!",
  parts: 4,
  posted: "Wed, 4 Jan 2012",
  title: "Seize the Day",
  uri: "https://www.barbershoptags.com/tags/Seize_The_Day.png",
  tracks: [],
  videos: [],
})

const fav99 = buildFavorite({
  id: 99,
  aka: "",
  arranger: "Frank Bloebaum",
  key: "Major:F",
  lyrics: "",
  parts: 4,
  posted: "Wed, 17 Dec 2008",
  title: "Where is Love?",
  uri: "https://www.barbershoptags.com/tags/Where_is_Love.gif",
  tracks: [],
  videos: [],
})

function singleFavState(fav: Favorite, labels: string[] = []): FavoritesState {
  return {
    ...InitialState,
    tagsById: {[fav.id]: fav},
    allTagIds: [fav.id],
    tagIdsByLabel: Object.fromEntries(labels.map(label => [label, []])),
    labels,
  }
}

function singleFavStateWithLabel(fav: Favorite, label: string): FavoritesState {
  const tagIdsByLabel = {[label]: [fav.id]}
  return {
    ...InitialState,
    tagsById: {[fav.id]: fav},
    allTagIds: [fav.id],
    labelsByTagId: {[fav.id]: [label]},
    labeledById: {[fav.id]: fav},
    tagIdsByLabel,
    labels: [label],
  }
}

function singleLabeledState(
  tag: Tag,
  label: string,
  otherLabels: string[] = [],
): FavoritesState {
  const tagId = tag.id
  const tagIdsByLabel = {[label]: [tagId]}
  otherLabels.forEach(l => (tagIdsByLabel[l] = []))
  return {
    ...InitialState,
    labelsByTagId: {[tagId]: [label]},
    labeledById: {[tagId]: tag},
    tagIdsByLabel,
    labels: otherLabels.concat([label]),
  }
}

// labels exist but no tags labeled
function labelsOnlyState(...labels: string[]): FavoritesState {
  return {
    ...InitialState,
    tagIdsByLabel: Object.fromEntries(labels.map(label => [label, []])),
    labels,
  }
}

const state12_99: FavoritesState = {
  ...InitialState,
  tagsById: {
    [fav12.id]: fav12,
    [fav99.id]: fav99,
  },
  allTagIds: [fav12.id, fav99.id],
}

describe("favorites reducer", () => {
  it("should add a favorite", () => {
    const action = addFavorite(fav12)
    const reducedState = reducer(InitialState, action)
    const expectedState: FavoritesState = singleFavState(fav12)
    expect(reducedState).toEqual(expectedState)
  })
  it("should add favorites idempotently", () => {
    const add12 = addFavorite(fav12)
    const addedState = reducer(InitialState, add12)
    expect(reducer(addedState, add12)).toEqual(singleFavState(fav12))
  })
  it("should add multiple favorites", () => {
    const add12 = addFavorite(fav12)
    const state1 = reducer(InitialState, add12)
    const add99 = addFavorite(fav99)
    const state2 = reducer(state1, add99)
    expect(state2).toEqual(state12_99)
  })
  it("should remove a favorite", () => {
    const addedState = reducer(InitialState, addFavorite(fav12))
    const removedState = reducer(addedState, removeFavorite(fav12.id))
    expect(removedState).toEqual(InitialState)
  })
  it("should remove favorites idempotently", () => {
    const state1 = reducer(InitialState, addFavorite(fav12))
    const state2 = reducer(state1, addFavorite(fav99))
    const state3 = reducer(state2, removeFavorite(fav12.id))
    expect(state3).toEqual(singleFavState(fav99))
    const state4 = reducer(state3, removeFavorite(fav12.id))
    expect(state4).toEqual(singleFavState(fav99))
  })
  it("should create a label", () => {
    const label = "organic"
    const state2 = reducer(InitialState, createLabel(label))
    expect(state2).toEqual(labelsOnlyState(label))
  })
  it("should not create a duplicate label", () => {
    const label = "organic"
    const state1 = reducer(InitialState, createLabel(label))
    const state2 = reducer(state1, createLabel(label))
    expect(state2).toEqual({
      ...labelsOnlyState(label),
      labelError: "label already exists",
    })
  })
  it("should create a label and add it to a tag", () => {
    const label = "fresh"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label}))
    expect(state2).toEqual(singleLabeledState(fav12, label))
  })
  it("should add a favorite then label it", () => {
    const label = "fresh"
    const state1 = reducer(InitialState, addFavorite(fav12))
    const state2 = reducer(state1, addLabel({tag: fav12, label: label}))
    expect(state2).toEqual(singleFavStateWithLabel(fav12, label))
  })
  it("should rename a label", () => {
    const label1 = "organic"
    const label2 = "fresh"
    const state1 = reducer(InitialState, addLabel({tag: fav12, label: label1}))
    const state2 = reducer(
      state1,
      renameLabel({oldLabel: label1, newLabel: label2}),
    )
    expect(state2).toEqual(singleLabeledState(fav12, label2))
  })
  it("should add labels idempotently", () => {
    const label = "organic"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label}))
    const state3 = reducer(state2, addLabel({tag: fav12, label: label}))
    expect(state3).toEqual(singleLabeledState(fav12, label))
  })
  it("should remove a label", () => {
    const label = "organic"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label}))
    expect(state2).toEqual(singleLabeledState(fav12, label))
    const state3 = reducer(
      state2,
      removeLabel({
        id: fav12.id,
        label: label,
        tagListType: TagListEnum.History,
      }),
    )
    expect(state3).toEqual(labelsOnlyState(label))
  })
  it("should set a tag as 'stranded' when removing the currently selected label", () => {
    const label = "organic"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label}))
    expect(state2).toEqual(singleLabeledState(fav12, label))
    const state3 = reducer(state2, selectLabel(label))
    expect(state3).toEqual({
      ...state2,
      selectedLabel: label,
    })
    const state4 = reducer(
      state3,
      removeLabel({
        id: fav12.id,
        label: label,
        tagListType: "organic",
      }),
    )
    expect(state4).toEqual({
      ...InitialState,
      labels: [label],
      selectedLabel: label,
      tagIdsByLabel: {[label]: []},
      strandedTag: {tag: fav12, label},
    })
  })
  it("should remove a label idempotently", () => {
    const label1 = "organic"
    const label2 = "fresh"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label1}))
    const state3 = reducer(state2, addLabel({tag: fav12, label: label2}))
    expect(state3.labelsByTagId).toEqual({[fav12.id]: [label1, label2]})
    expect(state3.tagIdsByLabel).toEqual({
      [label1]: [fav12.id],
      [label2]: [fav12.id],
    })
    const state4 = reducer(
      state3,
      removeLabel({
        id: fav12.id,
        label: label1,
        tagListType: TagListEnum.History,
      }),
    )
    expect(state4).toEqual(singleLabeledState(fav12, label2, [label1]))
    const state5 = reducer(
      state4,
      removeLabel({
        id: fav12.id,
        label: label1,
        tagListType: TagListEnum.History,
      }),
    )
    expect(state5).toEqual(singleLabeledState(fav12, label2, [label1]))
  })
  it("should delete a label", () => {
    const label1 = "organic"
    const label2 = "fresh"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label1}))
    const state3 = reducer(state2, addLabel({tag: fav12, label: label2}))
    const state4 = reducer(state3, deleteLabel(label1))
    expect(state4).toEqual(singleLabeledState(fav12, label2))
    const state5 = reducer(state4, deleteLabel(label2))
    expect(state5).toEqual(InitialState)
  })
  it("should delete labels idempotently", () => {
    const label1 = "organic"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label1}))
    const state4 = reducer(state2, deleteLabel(label1))
    const state5 = reducer(state4, deleteLabel(label1))
    expect(state5).toEqual(InitialState)
  })
  it("should clear labels", () => {
    const label1 = "organic"
    const label2 = "fresh"
    const state2 = reducer(InitialState, addLabel({tag: fav12, label: label1}))
    const state3 = reducer(state2, addLabel({tag: fav12, label: label2}))
    const state4 = reducer(state3, clearLabels())
    expect(state4).toEqual(InitialState)
  })
  it("should clear labels without affecting favorites", () => {
    const label1 = "organic"
    const state1 = reducer(InitialState, addFavorite(fav12))
    const state2 = reducer(state1, addLabel({tag: fav12, label: label1}))
    const state3 = reducer(state2, clearLabels())
    expect(state3).toEqual(singleFavState(fav12))
  })
})
