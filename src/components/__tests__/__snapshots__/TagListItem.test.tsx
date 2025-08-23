import { TagListEnum } from '@app/modules/tagLists'
import { render } from '@testing-library/react-native'
import Tag from '../../../lib/models/Tag'
import TagListItem from '../../TagListItem'

describe('TagListItem', () => {
  it('should show dot when it was the last viewed tag', () => {
    const tag: Tag = {
      tracks: [],
      videos: [],
      id: 1809,
      title: 'Lost',
      aka: 'In Your Eyes',
      arranger: 'Soren Wohlers',
      key: 'Minor:G',
      lyrics: 'And I will wait to face the skies,...',
      parts: 4,
      posted: 'Mon, 26 Dec 2011',
      uri: 'https://www.barbershoptags.com/tags/Lost.jpg',
    }
    const { getByTestId } = render(
      <TagListItem
        tag={tag}
        tagListType={TagListEnum.SearchResults}
        index={3}
        selected={true}
      />,
    )
    expect(getByTestId('tagleft_1809').props.children).toEqual('•')
  })
})
