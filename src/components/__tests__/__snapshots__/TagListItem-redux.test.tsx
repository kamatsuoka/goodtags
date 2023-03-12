import React from "react"
import TagListItem from "../../TagListItem"
import Tag from "../../../lib/models/Tag"
import {render, store} from "../../../modules/test-utils"
import {cleanup} from "@testing-library/react-native"
import {TagListType} from "@app/modules/tagLists"

afterEach(() => {
  cleanup()
  store.clearActions()
})

// test rendering TagListItem, but with react-redux provider wrapper
// imported from test-utils.
// this is just a test to show that react-redux gets initialized okay,
// there's no difference to the behavior of TagListItem.
describe("TagListItem", () => {
  it("should show dot when it was the last viewed tag", () => {
    const tag: Tag = {
      id: 1809,
      title: "Lost",
      aka: "In Your Eyes",
      arranger: "Soren Wohlers",
      key: "Minor:G",
      lyrics: "And I will wait to face the skies,...",
      parts: 4,
      posted: "Mon, 26 Dec 2011",
      uri: "https://www.barbershoptags.com/tags/Lost.jpg",
      videos: [],
      tracks: [],
    }
    const rendered = render(
      <TagListItem
        tag={tag}
        tagListType={TagListType.SearchResults}
        index={3}
        selected={true}
      />,
    )
    const textComponent = rendered.getByTestId("tagleft_1809")
    expect(textComponent.props.children).toEqual("•")
  })
})
