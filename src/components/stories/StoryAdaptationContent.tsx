'use client';

import type { AdaptationContent, StoryTextPart } from '@/lib/domain/schemas';
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

function isInlinePart(part: StoryTextPart): boolean {
  return part.type === 'text' || part.type === 'word' || part.type === 'em';
}

function renderInlinePart(
  part: StoryTextPart,
  blockKey: string,
  onPlayAudio: (request: StoryAudioPlayRequest) => void
) {
  if (part.type === 'text') {
    return part.value;
  }

  if (part.type === 'em') {
    return (
      <em key={blockKey} className="text-laranja not-italic font-semibold">
        {part.value}
      </em>
    );
  }

  if (part.type === 'word') {
    const isSpeech = part.tagSom ? isSpeechSoundTag(part.tagSom) : false;
    return (
      <InteractiveWord
        key={blockKey}
        variant={part.variant ?? 'default'}
        blockKey={blockKey}
        kind={isSpeech ? 'speech' : 'sfx'}
        audioTitle={part.textoParaAudio ?? part.value}
        audioDescription={isSpeech ? 'Fala do personagem' : 'Efeito sonoro'}
        audioPath={part.audioPath}
        sfxPrompt={part.sfxPrompt ?? part.tagSom}
        tagSom={part.tagSom}
        ariaLabel={part.ariaLabel}
        onPlay={onPlayAudio}
      >
        {part.value}
      </InteractiveWord>
    );
  }

  return null;
}

function renderBlockPart(
  part: StoryTextPart,
  blockKey: string,
  onPlayAudio: (request: StoryAudioPlayRequest) => void
) {
  if (part.type === 'interactive') {
    const isSpeech = isSpeechSoundTag(part.tagSom);
    return (
      <div key={blockKey} className="flex flex-wrap items-center gap-3">
        <AudioPill
          label={part.rotulo}
          variant={isSpeech ? 'fala' : 'efeito'}
          blockKey={blockKey}
          onPlay={onPlayAudio}
          audioTitle={part.rotulo}
          audioDescription={isSpeech ? 'Fala do personagem' : 'Efeito sonoro'}
          audioPath={part.audioPath}
          sfxPrompt={isSpeech ? undefined : part.tagSom}
          kind={isSpeech ? 'speech' : 'sfx'}
          playText={part.textoParaAudio}
          tagSom={part.tagSom}
        />
      </div>
    );
  }

  if (part.type === 'audio-pill') {
    return (
      <div key={blockKey} className="flex flex-wrap items-center gap-3">
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
  }

  return null;
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
      {page.paragraphs.map((paragraph, paragraphIndex) => {
        const allInline = paragraph.every(isInlinePart);

        if (allInline && paragraph.length > 0) {
          return (
            <p key={paragraphIndex}>
              {paragraph.map((part, partIndex) =>
                renderInlinePart(
                  part,
                  buildBlockKey(pageIndex, paragraphIndex, partIndex),
                  onPlayAudio
                )
              )}
            </p>
          );
        }

        return (
          <div key={paragraphIndex} className="space-y-5">
            {paragraph.map((part, partIndex) => {
              const blockKey = buildBlockKey(pageIndex, paragraphIndex, partIndex);

              if (isInlinePart(part)) {
                return (
                  <p key={blockKey}>
                    {renderInlinePart(part, blockKey, onPlayAudio)}
                  </p>
                );
              }

              return renderBlockPart(part, blockKey, onPlayAudio);
            })}
          </div>
        );
      })}
    </div>
  );
}
