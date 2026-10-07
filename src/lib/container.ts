import { prisma } from '@/lib/db/prisma';
import { createStorageProvider } from '@/lib/providers/create-storage-provider';
import { StubLlmProvider } from '@/lib/providers/stubs/stub-llm.provider';
import { ChatCompletionsLlmProvider } from '@/lib/providers/llm/chat-completions.provider';
import { ElevenLabsSfxProvider } from '@/lib/providers/elevenlabs/elevenlabs-sfx.provider';
import {
  createGoogleTtsProvider,
  resolveGoogleTtsRuntimeConfig,
} from '@/lib/providers/google/create-google-tts-provider';
import { StubSfxProvider } from '@/lib/providers/stubs/stub-sfx.provider';
import { StubTtsProvider } from '@/lib/providers/stubs/stub-tts.provider';
import { PrismaAdaptationRepository } from '@/lib/repositories/prisma/prisma-adaptation.repository';
import { PrismaChildProfileRepository } from '@/lib/repositories/prisma/prisma-child-profile.repository';
import { PrismaCollectionRepository } from '@/lib/repositories/prisma/prisma-collection.repository';
import { PrismaUsageRepository } from '@/lib/repositories/prisma/prisma-usage.repository';
import { PrismaUserStoryRepository } from '@/lib/repositories/prisma/prisma-user-story.repository';
import { PrismaVoteRepository } from '@/lib/repositories/prisma/prisma-vote.repository';
import { ChildProfileService } from '@/lib/services/child-profile.service';
import { FavoritesService } from '@/lib/services/favorites.service';
import { LibraryService } from '@/lib/services/library.service';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import { QuizService } from '@/lib/services/quiz.service';
import { StoryCacheService } from '@/lib/services/story-cache.service';
import { StoryGenerationService } from '@/lib/services/story-generation.service';
import { VoteService } from '@/lib/services/vote.service';
import { AudioService } from '@/lib/services/audio.service';
import { StorageAccessService } from '@/lib/services/storage-access.service';
import { UserDataService } from '@/lib/services/user-data.service';

const adaptationRepo = new PrismaAdaptationRepository(prisma);
const childProfileRepo = new PrismaChildProfileRepository(prisma);
const userStoryRepo = new PrismaUserStoryRepository(prisma);
const collectionRepo = new PrismaCollectionRepository(prisma);
const usageRepo = new PrismaUsageRepository(prisma);
const voteRepo = new PrismaVoteRepository(prisma);

const llmKey = process.env.LLM_API_KEY?.trim() ?? '';
const llmBaseUrl = process.env.LLM_BASE_URL?.trim() || 'https://api.openai.com/v1';
const llmModel = process.env.LLM_MODEL?.trim() || 'gpt-4o-mini';
const useLlmStub = process.env.LLM_USE_STUB === 'true' || !llmKey;

const llmProvider = useLlmStub
  ? new StubLlmProvider()
  : new ChatCompletionsLlmProvider({
      apiKey: llmKey,
      baseUrl: llmBaseUrl,
      model: llmModel,
      providerName: 'LLM',
    });

const googleTtsRuntimeConfig = resolveGoogleTtsRuntimeConfig(process.env);
const useTtsStub =
  process.env.TTS_USE_STUB === 'true' ||
  (!googleTtsRuntimeConfig.apiKey && !googleTtsRuntimeConfig.credentialsJson);

const ttsProvider = useTtsStub
  ? new StubTtsProvider()
  : createGoogleTtsProvider(googleTtsRuntimeConfig);

const elevenKey = process.env.ELEVENLABS_API_KEY?.trim() ?? '';
const elevenBaseUrl =
  process.env.ELEVENLABS_BASE_URL?.trim() || 'https://api.elevenlabs.io/v1';
const elevenSfxModel =
  process.env.ELEVENLABS_SFX_MODEL?.trim() || 'eleven_text_to_sound_v2';
const useSfxStub = process.env.TTS_USE_STUB === 'true' || !elevenKey;

const sfxProvider = useSfxStub
  ? new StubSfxProvider()
  : new ElevenLabsSfxProvider({
      apiKey: elevenKey,
      baseUrl: elevenBaseUrl,
      model: elevenSfxModel,
    });

const storageProvider = createStorageProvider();
const storageAccessService = new StorageAccessService(prisma);

const planLimitsService = new PlanLimitsService(usageRepo, childProfileRepo);
const audioService = new AudioService(
  prisma,
  ttsProvider,
  sfxProvider,
  storageProvider,
  googleTtsRuntimeConfig.cacheSuffix
);
const storyCacheService = new StoryCacheService(prisma);

export const container = {
  prisma,
  repositories: {
    adaptations: adaptationRepo,
    childProfiles: childProfileRepo,
    userStories: userStoryRepo,
    collections: collectionRepo,
    usage: usageRepo,
    votes: voteRepo,
  },
  providers: {
    llm: llmProvider,
    tts: ttsProvider,
    sfx: sfxProvider,
    storage: storageProvider,
  },
  services: {
    planLimits: planLimitsService,
    storyCache: storyCacheService,
    storyGeneration: new StoryGenerationService(
      prisma,
      adaptationRepo,
      userStoryRepo,
      usageRepo,
      childProfileRepo,
      planLimitsService,
      llmProvider,
      audioService,
      storyCacheService
    ),
    library: new LibraryService(adaptationRepo, userStoryRepo),
    favorites: new FavoritesService(userStoryRepo),
    childProfiles: new ChildProfileService(childProfileRepo, planLimitsService),
    quiz: new QuizService(adaptationRepo),
    votes: new VoteService(voteRepo, adaptationRepo, userStoryRepo),
    audio: audioService,
    storageAccess: storageAccessService,
    userData: new UserDataService(prisma, storageProvider),
    collections: collectionRepo,
  },
};

export type AppContainer = typeof container;
