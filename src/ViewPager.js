import React, { PureComponent } from 'react'
import {
  StyleSheet,
  Dimensions,
  ScrollView,
  View,
} from 'react-native'
import Mirror, { scrollviewBootstrap } from 'react-native-mirror'


const VIEWPORT_WIDTH = Dimensions.get('window').width

class ViewPager extends PureComponent {

  static defaultProps = {
    thresholdPages: 1,
    pageWidth: VIEWPORT_WIDTH,
    pagingEnabled: true,
    contentContainerStyle: {},
    renderRow: () => {},
    onPan: () => {},
    onPageChange: () => {},
    onScroll: () => {},
    disablePan: false,
    data: [],
    experimentalMirroring: false,
    showNativeScrollIndicator: false,
  }

  constructor(props) {
    super(props)

    this._pageWithDelta = (VIEWPORT_WIDTH - this.props.pageWidth) / 2

    this.pages = []

    this.state = {
      dataSource: [...this._prepareData(this.props.data || [])],
    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.scrollView.scrollTo({
        x: (VIEWPORT_WIDTH - this._pageWithDelta) * this.props.thresholdPages,
        animated: false,
      })
    }, 0)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      dataSource: [...this._prepareData(nextProps.data || [])],
    })
  }

  _setPageNumber = (data) => {
    return data.map((_data, index) => {
      return Object.assign({}, _data, {
        _pageNumber: index + 1,
      })
    })
  }

  _setPageIndex = data => {
    return data.map((_data, index) => {
      return Object.assign({}, _data, {
        _pageIndex: index,
      })
    })
  }

  _prepareData = (data) => {
    
    const multiplicator = Math.ceil(this.props.thresholdPages / data.length)

    const initializedData = this._setPageNumber(data)

    let thresholdDataFront = []
    let thresholdDataEnd = []

    for (let i = 0; i < multiplicator; i++) {
      thresholdDataFront = [...thresholdDataFront, ...[...initializedData].reverse()]
      thresholdDataEnd = [...thresholdDataEnd, ...initializedData]
    }

    const thresholdFront = thresholdDataFront.slice(0, this.props.thresholdPages).reverse()

    const thresholdEnd = thresholdDataEnd.slice(0, this.props.thresholdPages)

    let preparedData = [...thresholdFront, ...initializedData, ...thresholdEnd]
    preparedData = this._setPageIndex(preparedData)

    return [...preparedData]
  }

  _getPageNumberByIndex = index => {
    if (index === 0) return this.state.dataSource.length - 1
    if (index === this.state.dataSource.length - 1) return 1
    return index
  }

  _onScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x
    this.props.onScroll(offsetX)

    this.pageIndex = Math.ceil((offsetX / VIEWPORT_WIDTH) * 100) / 100

    if (this.pageIndex % 1 === 0) {
      if (this.pageIndex === 0) {

        this.scrollView.scrollTo({
          animated: false, 
          x: VIEWPORT_WIDTH * (this.state.dataSource.length - 2),
        })

      } else if (this.pageIndex === this.state.dataSource.length - 1) {

        this.scrollView.scrollTo({
          animated: false, 
          x: VIEWPORT_WIDTH,
        })

      } else {

        const pageNumber = this._getPageNumberByIndex(this.pageIndex)
        this.props.onPageChange(pageNumber)

      }
    }
  }

  scroll = dx => {
    this.scrollView.scrollTo({
      animated: false, 
      x: dx / (VIEWPORT_WIDTH / (VIEWPORT_WIDTH / 2)) - this.props.pageWidth / 2 + (VIEWPORT_WIDTH / this.props.thresholdPages),
    })
  }

  scrollToPage = pageNumber => {
    this.scrollView.scrollTo({
      animated: true, 
      x: (pageNumber + this.props.thresholdPages) * VIEWPORT_WIDTH,
    })
  }

  scrollToIndex = pageIndex => {
    this.scrollView.scrollTo({
      animated: true, 
      x: pageIndex * VIEWPORT_WIDTH,
    })
  }

  _renderRow = (item, index) => {

    let row = (
      <View 
        key={index}
        style={[styles.rowContainer, {
          width: this.props.pageWidth,
        }]}
      >
        {this.props.renderRow({
          data: item, 
          _pageNumber: item._pageNumber,
          _pageIndex: item._pageIndex,
        })}
      </View>
    )

    if (this.props.experimentalMirroring === true) {
      if (index <= this.props.thresholdPages) {
        row = (
          <Mirror
            key={index}
            connectionId={'mirror-' + index}
            containerStyle={styles.mirror}
            experimentalComponentDetection={true}
            mirroredProps={[
              scrollviewBootstrap,
            ]}
          >
            {row}
          </Mirror>
        )
      }

      if (index >= this.state.dataSource.length - this.props.thresholdPages - 1) {
        const idIndex = index - (this.state.dataSource.length - this.props.thresholdPages - 1)
        row = (
          <Mirror
            key={index}
            connectionId={'mirror-' + idIndex}
            containerStyle={styles.mirror}
            experimentalComponentDetection={true}
            mirroredProps={[
              scrollviewBootstrap,
            ]}
          >
            {row}
          </Mirror>
        )
      }
    }

    return row
  }

  render() {
    this.pages = []
    return (
      <View style={this.props.containerStyle}>
        <ScrollView
          ref={(scrollView) => {
            this.scrollView = scrollView
          }}
          horizontal={true}
          pagingEnabled={this.props.pagingEnabled}
          showsHorizontalScrollIndicator={this.props.showNativeScrollIndicator}
          showsVerticalScrollIndicator={this.props.showNativeScrollIndicator}
          onScroll={this._onScroll}
          scrollEventThrottle={1}
          contentContainerStyle={[styles.container, this.props.contentContainerStyle, {
            width: this.props.pageWidth * this.state.dataSource.length,
          }]}>

          {this.state.dataSource.map((item, index) => {
            return this._renderRow(item, index)
          })}
        </ScrollView>
      </View>
    )
  }
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    /*
     * bug in react-native
     * overflow style has to be set
     * https://github.com/facebook/react-native/issues/12926
     */
    overflow: 'scroll',
  },
  rowContainer: {
    flexGrow: 1,
  },
  mirror: {
    flexGrow: 1,
  },
})


ViewPager.propTypes = {
  contentContainerStyle: React.PropTypes.any,
  containerStyle: React.PropTypes.any,
  data: React.PropTypes.arrayOf(
    React.PropTypes.object
  ),
  thresholdPages: React.PropTypes.number,
  pageWidth: React.PropTypes.number,
  disablePan: React.PropTypes.bool,
  pagingEnabled: React.PropTypes.bool,
  experimentalMirroring: React.PropTypes.bool,
  showNativeScrollIndicator: React.PropTypes.bool,

  renderRow: React.PropTypes.func,
  onPageChange: React.PropTypes.func,
  onPan: React.PropTypes.func,
  onShouldSwitchToPage: React.PropTypes.func,
  onScroll: React.PropTypes.func,
}


export default ViewPager