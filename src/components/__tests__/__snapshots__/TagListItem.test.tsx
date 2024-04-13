import {TagListType} from "@app/modules/tagLists"
import TestRenderer from "react-test-renderer"
import Tag from "../../../lib/models/Tag"
import TagListItem from "../../TagListItem"

describe("TagListItem", () => {
  it("should show dot when it was the last viewed tag", () => {
    const tag: Tag = {
      tracks: [],
      videos: [],
      id: 1809,
      title: "Lost",
      aka: "In Your Eyes",
      arranger: "Soren Wohlers",
      key: "Minor:G",
      lyrics: "And I will wait to face the skies,...",
      parts: 4,
      posted: "Mon, 26 Dec 2011",
      uri: "https://www.barbershoptags.com/tags/Lost.jpg",
    }
    const testRenderer = TestRenderer.create(
      <TagListItem
        tag={tag}
        tagListType={TagListType.SearchResults}
        index={3}
        selected={true}
      />,
    )
    const testInstance = testRenderer.root
    const view = testInstance.findByProps({testID: "tagleft_1809"})
    expect(view.props.children).toEqual("•")
  })
})
