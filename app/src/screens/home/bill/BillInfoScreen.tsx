import React, { ReactNode, ReactNodeArray } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { colors } from '../../../assets';
import {
  Bill,
  BillActionTag,
  BillMetadata,
  formatBillNumber,
} from '../../../models/Bill';
//@ts-ignore
import TouchableScale from 'react-native-touchable-scale';
import { Network } from '../../../util';
import { BillDetailsInfoScreenProps } from './BillDetailsStack';
import * as Animatable from 'react-native-animatable';
import { SharedElement } from 'react-navigation-shared-element';
import { BlurView } from '@react-native-community/blur';
import { Category, DefaultCategory } from '../../../models/Category';
import { Config } from '../../../util/Config';
import { Analytics } from '../../../util/services/AnalyticsHandler';
import inappmessaging from '@react-native-firebase/in-app-messaging';
import { Browser } from '../../../util/Browser';
import { User, UserHandler } from '../../../redux/models/user';
import store from '../../../redux/store';
import BillProgressBar from '../../../components/BillProgressBar';
import { StorageService } from '../../../redux/storage';
import { connect } from 'react-redux';
import { UIStatus } from '../../../redux/ui/ui.types';
import { FeedService } from '../../../redux/feed';
import { voteButtonAnimation } from '../../../components/Animations';
import { BillStatusCode } from '../../../redux/bill/bill.types';
import { BillService } from '../../../redux/bill';
import tinycolor from 'tinycolor2';
import Skeleton, { Skeletons } from '../../../components/Skeleton';
import { Odyssey } from '../../Navigator';
import { StackActions } from 'react-navigation';

interface Props {
  bill?: Bill;
  user: User;
  navigation: BillDetailsInfoScreenProps;
}

enum ScrollDirection {
  up,
  down,
}

type State = {
  expanded: boolean;
  animation: Animated.Value;
  numberLines: number | undefined;
  transition: Animated.Value;
  transitionComplete: boolean;
  contentRef: React.RefObject<ScrollView>;
  scroll: Animated.Value;
  likeY: number;
  scrollPos: number;
  scrollDirection: ScrollDirection;
  scrollAnimating: boolean;
};

const AnimatedSharedElement = Animated.createAnimatedComponent(SharedElement);
const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);
const { height } = Dimensions.get('screen');

function mapStoreToProps() {
  let { ui, storage, bill } = store.getState();
  let user = storage.user;

  let b = bill.status.bill;
  return {
    user,
    bill: b,
  };
}

class BillInfoScreen extends React.PureComponent<Props, State> {
  private category: Category;
  private blurType: 'light' | 'ultraThinMaterial';
  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
      animation: new Animated.Value(0),
      numberLines: 5,
      transition: new Animated.Value(0),
      transitionComplete: true,
      contentRef: React.createRef<ScrollView>(),
      likeY: 220,
      scroll: new Animated.Value(0),
      scrollPos: 0,
      scrollDirection: ScrollDirection.down,
      scrollAnimating: false,
    };
    if (this.props.bill) {
      this.category = Config.getTopics()[this.props.bill.category];
      if (!this.category) {
        this.category = DefaultCategory;

        Config.alertUpdateConfig().then(() => {
          this.forceUpdate();
        });
      }
    } else {
      this.category = DefaultCategory;
    }

    let isDark = tinycolor(this.category.bgColor).isDark();
    this.blurType = isDark ? 'light' : 'ultraThinMaterial';
  }
  componentDidMount() {
    this.props.navigation.addListener('transitionStart', (e) => {
      if (e.data.closing) {
        Animated.timing(this.state.transition, {
          toValue: 1,
          useNativeDriver: false,
          duration: 300,
        }).start();
      } else {
        Animated.timing(this.state.transition, {
          toValue: 1,
          useNativeDriver: false,
          duration: 3000,
        }).start(() => {
          this.setState({ transitionComplete: true });
        });
      }
    });
  }

  render() {
    const { bill } = this.props;

    if (bill) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
          }}
        >
          <Header bill={bill} scroll={this.state.scroll} />
          <Animated.ScrollView
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: this.state.scroll } } }],
              {
                useNativeDriver: true,
                listener: (e) => {
                  //@ts-ignore
                  let newPos = e.nativeEvent.contentOffset.y;
                  this.setState({
                    scrollDirection:
                      newPos - this.state.scrollPos > 0
                        ? ScrollDirection.down
                        : ScrollDirection.up,
                  });
                  this.setState({ scrollPos: newPos });
                },
              }
            )}
            ref={this.state.contentRef}
            onScrollBeginDrag={() => {
              this.setState({ scrollAnimating: false });
            }}
            onMomentumScrollEnd={(e: any) => {
              if (!this.state.scrollAnimating) {
                let y = e.nativeEvent.contentOffset.y;
                let isDown = this.state.scrollDirection == ScrollDirection.down;
                if (y > 0.05 * height && y < 0.3 * height && isDown) {
                  this.state.contentRef.current?.scrollTo({
                    y: 0.275 * height,
                  });
                  this.setState({ scrollAnimating: true });
                } else if (y <= 0.05 * height && isDown) {
                  this.state.contentRef.current?.scrollTo({ y: 0 });
                  this.setState({ scrollAnimating: true });
                } else if (y <= 0.35 * height && !isDown) {
                  this.state.contentRef.current?.scrollTo({ y: 0 });
                  this.setState({ scrollAnimating: true });
                } else {
                  this.state.contentRef.current?.scrollTo({ y: y });
                }
              }
            }}
            onScrollEndDrag={(e: any) => {
              if (!this.state.scrollAnimating) {
                let y = e.nativeEvent.contentOffset.y;
                let isDown = this.state.scrollDirection == ScrollDirection.down;
                if (y > 0.05 * height && y < 0.3 * height && isDown) {
                  this.state.contentRef.current?.scrollTo({
                    y: 0.275 * height,
                  });
                  this.setState({ scrollAnimating: true });
                } else if (y <= 0.05 * height && isDown) {
                  this.state.contentRef.current?.scrollTo({ y: 0 });
                  this.setState({ scrollAnimating: true });
                } else if (y <= 0.35 * height && !isDown) {
                  this.state.contentRef.current?.scrollTo({ y: 0 });
                  this.setState({ scrollAnimating: true });
                }
              }
            }}
            overScrollMode="never"
            scrollToOverflowEnabled={true}
          >
            <Cover
              bill={bill}
              category={this.category}
              scroll={this.state.scroll}
            />
            <Body bill={bill} />
          </Animated.ScrollView>
          {this.closeButton()}
          {this.likeButton()}
          {this.footer()}
        </View>
      );
    } else {
      return (
        <View>
          <Skeleton loading={true} skeleton={Skeletons.RepCard} />
        </View>
      );
    }
  }

  footer = () => {
    const { height } = Dimensions.get('screen');
    const { bill } = this.props;
    if (bill) {
      return (
        <View
          style={{
            height: height * 0.07,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginBottom: '7%',
            marginHorizontal: '7.5%',
            backgroundColor: 'transparent',
          }}
        >
          <Animatable.View
            animation={voteButtonAnimation}
            iterationCount={'infinite'}
            duration={2000}
            iterationDelay={3000}
            style={styles.voteButton}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={() => {
                // @ts-ignore
                this.props.navigation.push('Vote', this.props.route.params);
              }}
            >
              <Icon
                type="material-community"
                name="vote-outline"
                size={30}
                color="white"
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  fontFamily: 'Futura',
                  marginLeft: '10%',
                  color: 'white',
                }}
              >
                Share your thoughts!
              </Text>
            </TouchableOpacity>
          </Animatable.View>
          <View style={styles.fullBill}>
            <TouchableScale
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => {
                Analytics.billFullPage(bill);
                Browser.openURL(bill.url, true, true);
              }}
            >
              <Icon
                type="feather"
                name="external-link"
                size={30}
                color="black"
              />
            </TouchableScale>
          </View>
        </View>
      );
    } else {
      return null;
    }
  };

  likeButton = () => {
    const { bill, user } = this.props;
    if (bill) {
      let liked = UserHandler.hasLikedBill(user, bill);

      return (
        <Animated.View
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            top: '23%',
            right: '6%',
            zIndex: 100,
            transform: [
              {
                translateY: this.state.scroll.interpolate({
                  inputRange: [-1, 0, height * 0.25, height * 0.3],
                  outputRange: [0, 0, -0.17 * height, -0.17 * height],
                }),
              },
            ],
          }}
        >
          <BlurView
            style={[styles.likeButton]}
            blurType={this.blurType}
            blurAmount={15}
            overlayColor={'black'}
          >
            <TouchableOpacity
              style={{ width: '100%', height: '100%' }}
              onPress={() => {
                Network.likeBill(bill, !liked);
                store.dispatch(StorageService.billLike(bill, !liked));
              }}
            >
              <Animatable.View
                animation={liked ? 'pulse' : undefined}
                iterationCount="infinite"
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon
                  size={26}
                  name={liked ? 'heart-sharp' : 'heart-outline'}
                  type="ionicon"
                  color={liked ? colors.republican : 'white'}
                />
              </Animatable.View>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      );
    } else {
      return null;
    }
  };

  // generate the close button
  closeButton = () => {
    return (
      <BlurView style={styles.closeButton} blurType={this.blurType}>
        <TouchableOpacity
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            Odyssey.navigationRef.current?.goBack();
          }}
        >
          <Icon size={26} name="arrow-left" type="feather" color="white" />
        </TouchableOpacity>
      </BlurView>
    );
  };
}

function Cover(props: {
  bill: Bill;
  scroll: Animated.Value;
  category: Category;
}) {
  const { bill, scroll, category } = props;
  let isDark = tinycolor(category.bgColor).isDark();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View>
        <AnimatedSharedElement
          id={`bill.${bill.number}.photo`}
          style={[
            styles.imageContainer,
            {
              minHeight: 0.125 * height,
              maxHeight: 0.35 * height,
              height: 0.3 * height,
              zIndex: 100,
              transform: [
                {
                  scale: scroll.interpolate({
                    inputRange: [-0.3 * height, -0.2 * height, 0, 0.3 * height],
                    outputRange: [1.2, 1.2, 1, 1],
                  }),
                },
                {
                  translateY: scroll.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-0.5, 0, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AnimatedFastImage
            resizeMode="cover"
            style={[
              styles.image,
              {
                transform: [
                  {
                    translateY: scroll.interpolate({
                      inputRange: [0, 0.3 * height],
                      outputRange: [0, 0.1 * height],
                    }),
                  },
                ],
              },
            ]}
            source={{ uri: category.image }}
          />
        </AnimatedSharedElement>
        <Animated.View
          style={{
            marginHorizontal: '7.5%',
            marginTop: '3.5%',
            transform: [
              {
                translateY: scroll.interpolate({
                  inputRange: [-1, 0, 0.3 * height],
                  outputRange: [0, 0, -0.1 * height],
                }),
              },
            ],
          }}
        >
          <View style={styles.categoriesContainer}>
            <Text style={styles.number}>{formatBillNumber(bill)}</Text>
            <SharedElement
              id={`bill.${bill.number}.category`}
              style={[
                styles.category,
                { backgroundColor: category.categoryColor },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: category.categoryTextColor },
                ]}
              >
                {bill.category}
              </Text>
            </SharedElement>
          </View>
          <Text style={styles.title}>{bill.title}</Text>
        </Animated.View>
      </View>
    </>
  );
}

function Header(props: { bill: Bill; scroll: Animated.Value }) {
  const { bill, scroll } = props;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: '100%',
          height: 0.125 * height,
          zIndex: 100,
          shadowRadius: 10,
          shadowOpacity: 0.35,
          shadowColor: 'black',
          shadowOffset: { width: 0, height: 2 },
          borderBottomLeftRadius: 15,
          borderBottomRightRadius: 15,
          overflow: 'hidden',
        },
        {
          opacity: scroll.interpolate({
            inputRange: [0, 0.15 * height, 0.25 * height],
            outputRange: [0, 0, 1],
            extrapolate: 'clamp',
          }),
        },
      ]}
    >
      <BlurView
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        blurType="ultraThinMaterial"
        blurAmount={5}
      >
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontFamily: 'Futura',
            marginHorizontal: '20%',
            marginTop: '10%',
            fontSize: 16,
            textAlign: 'center',
          }}
          numberOfLines={2}
          adjustsFontSizeToFit={true}
        >
          {bill.title}
        </Text>
      </BlurView>
    </Animated.View>
  );
}

function Body(props: { bill: Bill }) {
  const { bill } = props;
  return (
    <View style={[styles.content]}>
      <BillProgressBar bill={bill} />
      <Text ellipsizeMode="tail" style={styles.synopsis}>
        {bill.short_summary + bill.full_summary}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '78.2%',
    height: '46%',
    marginTop: '89%',
    alignSelf: 'center',
    borderRadius: 40,
    backgroundColor: 'white',
  },

  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2.5 },
  },
  image: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flex: 1,
  },
  content: {
    borderRadius: 20,
    marginTop: '2.5%',
    marginBottom: '10%',
    paddingHorizontal: '7.5%',
    zIndex: 0,
  },
  number: {
    fontFamily: 'Roboto-Light',
    fontWeight: '400',
    fontSize: 16,
    color: colors.blueGray,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Futura',
    fontWeight: '700',
    marginTop: '1%',
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    backgroundColor: colors.finishButtonIconColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2%',
    paddingHorizontal: '4%',
    borderRadius: 20,
  },
  categoryText: { color: 'white', fontWeight: 'bold' },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: '10%',
  },
  synopsis: {
    flex: 1,
    flexWrap: 'wrap',
    textAlignVertical: 'center',
    marginTop: '5%',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Futura',
    textAlign: 'justify',
  },
  closeButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    left: '6%',
    top: '6%',
    zIndex: 100,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    marginHorizontal: 20,
  },
  backButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7.5,
    shadowColor: 'black',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    zIndex: 150,
    backgroundColor: colors.votingBackgroundColor,
    marginRight: '5%',
    flex: 7,
  },
  fullBill: {
    justifyContent: 'center',
    borderRadius: 7.5,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.25,
    width: height * 0.07,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 150,
  },
  voteText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default connect(mapStoreToProps)(BillInfoScreen);
