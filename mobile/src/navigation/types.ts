import { ForumTopic } from '../data/forum';
import { EvListing } from '../data/marketplace';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ForumDetail: { topic: ForumTopic };
  ListingDetail: { listing: EvListing };
  Messages: undefined;
  Chat: { conversationId: string };
  UserProfile: {
    userId: string;
    name: string;
    initials: string;
    color: string;
    contextTitle?: string;
  };
  SavedTopics: undefined;
  Settings: undefined;
  UserTopics: {
    userId: string;
    name: string;
  };
};
