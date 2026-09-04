import { prisma } from '@/lib/db/prisma';
import { FallbackBibleTextProvider } from '@/lib/providers/fallback-bible-text.provider';
import { LocalStorageProvider } from '@/lib/providers/local/local-storage.provider';
import { StubBibleTextProvider } from '@/lib/providers/stubs/stub-bible-text.provider';
import { StubLlmProvider } from '@/lib/providers/stubs/stub-llm.provider';
import { ChatCompletionsLlmProvider } from '@/lib/providers/llm/chat-completions.provider';
import { ElevenLabsSfxProvider } from '@/lib/providers/elevenlabs/elevenlabs-sfx.provider';
import { ElevenLabsTtsProvider } from '@/lib/providers/elevenlabs/elevenlabs-tts.provider';
import { StubSfxProvider } from '@/lib/providers/stubs/stub-sfx.provider';
import { StubTtsProvider } from '@/lib/providers/stubs/stub-tts.provider';
import { YouVersionBibleProvider } from '@/lib/providers/youversion/youversion-bible.provider';
import { PrismaAdaptationRepository } from '@/lib/repositories/prisma/prisma-adaptation.repository';
import { PrismaChildProfileRepository } from '@/lib/repositories/prisma/prisma-child-profile.repository';
import { PrismaCollectionRepository } from '@/lib/repositories/prisma/prisma-collection.repository';
import { PrismaUsageRepository } from '@/lib/repositories/prisma/prisma-usage.repository';
import { PrismaUserStoryRepository } from '@/lib/repositories/prisma/prisma-user-story.repository';
import { PrismaVoteRepository } from '@/lib/repositories/prisma/prisma-vote.repository';
import { BibleTextService } from '@/lib/services/bible-text.service';
import { ChildProfileService } from '@/lib/services/child-profile.service';
import { FavoritesService } from '@/lib/services/favorites.service';
import { LibraryService } from '@/lib/services/library.service';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import { QuizService } from '@/lib/services/quiz.service';
import { StoryGenerationService } from '@/lib/services/story-generation.service';
import { VoteService } from '@/lib/services/vote.service';
import { AudioService } from '@/lib/services/audio.service';

const adaptationRepo = new PrismaAdaptationRepository(prisma);
const childProfileRepo = new PrismaChildProfileRepository(prisma);
const userStoryRepo = new PrismaUserStoryRepository(prisma);
const collectionRepo = new PrismaCollectionRepository(prisma);
const usageRepo = new PrismaUsageRepository(prisma);
const voteRepo = new PrismaVoteRepository(prisma);

const yvpKey = process.env.YVP_APP_KEY?.trim() ?? '';
const useStubOnly = process.env.YVP_USE_STUB === 'true' || !yvpKey;

const stubBibleProvider = new StubBibleTextProvider();
const bibleProvider =
  yvpKey && !useStubOnly
    ? new FallbackBibleTextProvider(
        new YouVersionBibleProvider(yvpKey),
        stubBibleProvider,
        (error, params) => {
          if (process.env.NODE_ENV === 'development') {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(
              `[BibleText] YouVersion indisponível para ${params.bibleVersionId} — usando texto local. ${detail}`
            );
          }
        }
      )
    : stubBibleProvider;

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
const elevenKey = process.env.ELEVENLABS_API_KEY?.trim() ?? '';
const elevenBaseUrl =
  process.env.ELEVENLABS_BASE_URL?.trim() || 'https://api.elevenlabs.io/v1';
const elevenVoiceId = process.env.ELEVENLABS_TTS_VOICE_ID?.trim() ?? '';
const elevenTtsModel =
  process.env.ELEVENLABS_TTS_MODEL?.trim() || 'eleven_multilingual_v2';
const elevenSfxModel =
  process.env.ELEVENLABS_SFX_MODEL?.trim() || 'eleven_text_to_sound_v2';
const useAudioStub =
  process.env.TTS_USE_STUB === 'true' || !elevenKey || !elevenVoiceId;

const ttsProvider = useAudioStub
  ? new StubTtsProvider()
  : new ElevenLabsTtsProvider({
      apiKey: elevenKey,
      baseUrl: elevenBaseUrl,
      voiceId: elevenVoiceId,
      model: elevenTtsModel,
    });

const sfxProvider = useAudioStub
  ? new StubSfxProvider()
  : new ElevenLabsSfxProvider({
      apiKey: elevenKey,
      baseUrl: elevenBaseUrl,
      model: elevenSfxModel,
    });

const storageProvider = new LocalStorageProvider();

const bibleTextService = new BibleTextService(bibleProvider);
const planLimitsService = new PlanLimitsService(usageRepo, childProfileRepo);
const audioService = new AudioService(prisma, ttsProvider, sfxProvider, storageProvider);

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
    bible: bibleProvider,
    llm: llmProvider,
    tts: ttsProvider,
    sfx: sfxProvider,
    storage: storageProvider,
  },
  services: {
    bibleText: bibleTextService,
    planLimits: planLimitsService,
    storyGeneration: new StoryGenerationService(
      prisma,
      adaptationRepo,
      userStoryRepo,
      usageRepo,
      childProfileRepo,
      planLimitsService,
      bibleTextService,
      llmProvider,
      audioService
    ),
    library: new LibraryService(adaptationRepo, userStoryRepo),
    favorites: new FavoritesService(userStoryRepo),
    childProfiles: new ChildProfileService(childProfileRepo, planLimitsService),
    quiz: new QuizService(adaptationRepo),
    votes: new VoteService(voteRepo, adaptationRepo),
    audio: audioService,
    collections: collectionRepo,
  },
};

export type AppContainer = typeof container;
