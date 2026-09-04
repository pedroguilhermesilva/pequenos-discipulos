'use client';

import type { AdaptationContent } from '@/lib/domain/schemas';
import { AudioPill } from '@/components/stories/AudioPill';
import { InteractiveWord } from '@/components/stories/InteractiveWord';
import type { StoryAudioPlayRequest } from '@/lib/stories/audio-play';
import { isSpeechSoundTag } from '@/lib/stories/sound-tag';

interface StoryAdaptationContentProps {
  content: AdaptationContent;
  pageIndex: number;
  onPlayAudio: (request: StoryAudioPlayRequest) => void;
}

function buildBlockKey(pageIndex: number, paragraphIndex: number, partIndex: number) {
  return `p${pageIndex}-par${paragraphIndex}-part${partIndex}`;
}

export function StoryAdaptationContent({
  content,
  pageIndex,
  onPlayAudio,
}: StoryAdaptationContentProps) {
  const page = content.pages[pageIndex];
  if (!page) return null;

  return (
    <div className="font-story space-y-5 text-tinta text-lg md:text-xl leading-relaxed">
      {page.paragraphs.map((paragraph, paragraphIndex) => (
        <div key={paragraphIndex} className="space-y-5">
          {paragraph.map((part, partIndex) => {
            const key = `${paragraphIndex}-${partIndex}`;
            const blockKey = buildBlockKey(pageIndex, paragraphIndex, partIndex);

            if (part.type === 'text') {
              return <p key={key}>{part.value}</p>;
            }

            if (part.type === 'em') {
              return (
                <p key={key}>
                  <em className="text-laranja not-italic font-semibold">{part.value}</em>
                </p>
              );
            }

            if (part.type === 'interactive') {
              const isSpeech = isSpeechSoundTag(part.tagSom);
              return (
                <div key={key} className="flex flex-wrap items-center gap-3">
                  <AudioPill
                    label={part.rotulo}
                    variant={isSpeech ? 'fala' : 'efeito'}
                    blockKey={blockKey}
                    onPlay={onPlayAudio}
                    audioTitle={part.rotulo}
                    audioDescription={
                      isSpeech ? 'Fala do personagem' : 'Efeito sonoro'
                    }
                    audioPath={part.audioPath}
                    sfxPrompt={isSpeech ? undefined : part.tagSom}
                    kind={isSpeech ? 'speech' : 'sfx'}
                    playText={part.textoParaAudio}
                    tagSom={part.tagSom}
                  />
                </div>
              );
            }

            if (part.type === 'word') {
              return (
                <p key={key}>
                  <InteractiveWord
                    variant={part.variant ?? 'default'}
                    blockKey={blockKey}
                    kind="sfx"
                    audioTitle={part.value}
                    audioDescription="Efeito sonoro"
                    audioPath={part.audioPath}
                    sfxPrompt={part.sfxPrompt}
                    onPlay={onPlayAudio}
                  >
                    {part.value}
                  </InteractiveWord>
                </p>
              );
            }

            return (
              <div key={key} className="flex flex-wrap items-center gap-3">
                <AudioPill
                  label={part.label}
                  variant={part.variant === 'narracao' ? 'fala' : part.variant ?? 'efeito'}
                  blockKey={blockKey}
                  onPlay={onPlayAudio}
                  audioTitle={part.label}
                  audioPath={part.audioPath}
                  sfxPrompt={part.sfxPrompt}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
